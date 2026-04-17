import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/PageContainer";
import { FloatingRightNav } from "@/components/FloatingRightNav";
import { SpotCard } from "@/components/SpotCard";
import { SpotCardSkeleton } from "@/components/SpotCardSkeleton";
import { DeleteSpotModal } from "@/components/DeleteSpotModal";
import { useAuth } from "@/contexts/AuthContext";
import { getUserFriendlyErrorMessage } from "@/lib/error-message";
import { importGoogleMapsLibrary } from "@/lib/google-maps";
import type { Spot } from "@/types/api";
import {
  Compass,
  MapPin,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Navigation,
  Plus,
  RefreshCw,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { deleteSpot, searchSpots } from "@/server/spots";
import { addFavoriteSpot, removeFavoriteSpot } from "@/server/favorites";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/explore")({
  component: ExplorePage,
});

type SelectedLocation = {
  lat: number;
  lng: number;
  label: string;
};

type LocationSuggestion = {
  placePrediction: {
    toPlace?: () => {
      fetchFields: (request: { fields: string[] }) => Promise<void>;
      displayName?: string;
      formattedAddress?: string;
      location?:
        | {
            lat?: () => number;
            lng?: () => number;
          }
        | {
            lat?: number;
            lng?: number;
          };
    };
    text?: {
      toString?: () => string;
    };
  };
  text: string;
};

function getCoordinateValue(
  value:
    | {
        lat?: (() => number) | number;
        lng?: (() => number) | number;
      }
    | undefined,
  axis: "lat" | "lng",
) {
  const coordinate = value?.[axis];
  if (typeof coordinate === "function") {
    return coordinate();
  }

  return typeof coordinate === "number" ? coordinate : null;
}

function ExplorePage() {
  const { isLoggedIn, user } = useAuth();
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Spot | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchInput, setDebouncedSearchInput] = useState("");
  const [radiusMiles, setRadiusMiles] = useState("5");
  const [selectedLocation, setSelectedLocation] =
    useState<SelectedLocation | null>(null);
  const [locationSuggestions, setLocationSuggestions] = useState<
    LocationSuggestion[]
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSpotType, setSelectedSpotType] = useState("all");
  const [minimumRating, setMinimumRating] = useState("any");
  const [reviewedOnly, setReviewedOnly] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [refreshKey, setRefreshKey] = useState(0);
  const [favoritePendingIds, setFavoritePendingIds] = useState<number[]>([]);
  const sessionTokenRef = useRef<unknown>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchInput(searchInput.trim());
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    const runSpotSearch = async () => {
      try {
        setLoading(true);
        setError("");
        const result = await searchSpots({
          data: {
            query: selectedLocation ? "" : debouncedSearchInput,
            latitude: selectedLocation?.lat,
            longitude: selectedLocation?.lng,
            radiusMiles: Number(radiusMiles),
            viewerUserId: user?.userId,
          },
        });
        setSpots(result ?? []);
      } catch (err) {
        setError(
          getUserFriendlyErrorMessage(
            err,
            "Something went wrong while loading study spots.",
          ),
        );
      } finally {
        setLoading(false);
      }
    };

    void runSpotSearch();
  }, [debouncedSearchInput, selectedLocation, radiusMiles, refreshKey, user?.userId]);

  useEffect(() => {
    const inputValue = searchInput.trim();

    if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY || !inputValue || selectedLocation) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    let cancelled = false;

    const loadSuggestions = async () => {
      try {
        const placesLibrary = (await importGoogleMapsLibrary("places")) as {
          AutocompleteSuggestion: {
            fetchAutocompleteSuggestions: (request: {
              input: string;
              sessionToken?: unknown;
              origin?: { lat: number; lng: number };
            }) => Promise<{ suggestions?: Array<LocationSuggestion> }>;
          };
          AutocompleteSessionToken: new () => unknown;
        };

        if (!sessionTokenRef.current) {
          sessionTokenRef.current =
            new placesLibrary.AutocompleteSessionToken();
        }

        const response =
          await placesLibrary.AutocompleteSuggestion.fetchAutocompleteSuggestions(
            {
              input: inputValue,
              sessionToken: sessionTokenRef.current,
            origin: undefined,
            },
          );

        if (cancelled) {
          return;
        }

        const suggestions = (response.suggestions ?? [])
          .slice(0, 5)
          .map((suggestion) => ({
            placePrediction: suggestion.placePrediction,
            text:
              suggestion.placePrediction?.text?.toString?.() ??
              "Unknown location",
          }))
          .filter((suggestion) => suggestion.text.trim().length > 0);

        setLocationSuggestions(suggestions);
        setShowSuggestions(suggestions.length > 0);
      } catch {
        if (!cancelled) {
          setLocationSuggestions([]);
          setShowSuggestions(false);
        }
      }
    };

    const timeoutId = window.setTimeout(loadSuggestions, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [searchInput, selectedLocation]);

  const clearLocationSearch = () => {
    setSelectedLocation(null);
    setLocationError("");
    setSearchInput("");
    setLocationSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSelectSuggestion = async (suggestion: LocationSuggestion) => {
    try {
      setLocationError("");
      setLocationLoading(true);
      const place = suggestion.placePrediction.toPlace?.();

      if (!place) {
        throw new Error("Google Maps could not load this location.");
      }

      await place.fetchFields({
        fields: ["displayName", "formattedAddress", "location"],
      });

      const lat = getCoordinateValue(place.location, "lat");
      const lng = getCoordinateValue(place.location, "lng");

      if (lat === null || lng === null) {
        throw new Error("This place did not include coordinates.");
      }

      const label =
        place.formattedAddress || place.displayName || suggestion.text;

      setSelectedLocation({ lat, lng, label });
      setSearchInput(label);
      setLocationSuggestions([]);
      setShowSuggestions(false);
      sessionTokenRef.current = null;
    } catch (err) {
      setLocationError(
        getUserFriendlyErrorMessage(
          err,
          "We couldn't turn that place into a nearby search.",
        ),
      );
    } finally {
      setLocationLoading(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError("Your browser does not support current location.");
      return;
    }

    setLocationError("");
    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        let label = "Current location";

        try {
          if (import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
            const geocodingLibrary = (await importGoogleMapsLibrary(
              "geocoding",
            )) as {
              Geocoder: new () => {
                geocode: (request: {
                  location: { lat: number; lng: number };
                }) => Promise<{
                  results?: Array<{ formatted_address?: string }>;
                }>;
              };
            };
            const geocoder = new geocodingLibrary.Geocoder();
            const response = await geocoder.geocode({
              location: { lat, lng },
            });
            label = response.results?.[0]?.formatted_address || label;
          }
        } catch {
          label = "Current location";
        }

        setSelectedLocation({ lat, lng, label });
        setSearchInput(label);
        setLocationSuggestions([]);
        setShowSuggestions(false);
        setLocationLoading(false);
      },
      (geoError) => {
        setLocationLoading(false);
        setLocationError(
          getUserFriendlyErrorMessage(
            geoError,
            "We couldn't access your current location. Check your browser permission and try again.",
          ),
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  };

  const handleDeleteSpot = async (spotId: number) => {
    try {
      const result = await deleteSpot({
        data: { spotId },
      });
      if (result?.success) {
        setSpots((prev) => prev.filter((spot) => spot.spot_id !== spotId));
        setDeleteTarget(null);
      }
    } catch (err) {
      alert(
        getUserFriendlyErrorMessage(
          err,
          "Something went wrong while deleting the spot.",
        ),
      );
    }
  };

  const handleToggleFavorite = async (
    spotId: number,
    nextIsFavorited: boolean,
  ) => {
    if (!user) {
      toast.error("Sign in to save favorites.");
      return;
    }

    const previousSpots = spots;

    setFavoritePendingIds((current) => [...current, spotId]);
    setSpots((current) =>
      current.map((spot) =>
        spot.spot_id === spotId
          ? { ...spot, is_favorited: nextIsFavorited }
          : spot,
      ),
    );

    try {
      const result = nextIsFavorited
        ? await addFavoriteSpot({
            data: { userId: user.userId, spotId },
          })
        : await removeFavoriteSpot({
            data: { userId: user.userId, spotId },
          });

      toast.success(result.message);
    } catch (err) {
      setSpots(previousSpots);
      toast.error(
        getUserFriendlyErrorMessage(
          err,
          "We couldn't update favorites right now.",
        ),
      );
    } finally {
      setFavoritePendingIds((current) =>
        current.filter((pendingId) => pendingId !== spotId),
      );
    }
  };

  const navigate = useNavigate();

  const handleViewDetails = (spotId: number) => {
    if (!isLoggedIn) {
      navigate({ to: "/signin" });
      return;
    }

    navigate({
      to: "/spot/$spotId",
      params: { spotId: String(spotId) },
      search: { from: undefined, adminPreview: false },
    });
  };

  const availableSpotTypes = Array.from(
    new Set(spots.map((spot) => spot.spot_type).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));

  const visibleSpots = spots
    .filter((spot) => {
      if (selectedSpotType !== "all" && spot.spot_type !== selectedSpotType) {
        return false;
      }

      if (minimumRating !== "any") {
        const threshold = Number(minimumRating);

        if (
          spot.average_rating === null ||
          Number(spot.average_rating) < threshold
        ) {
          return false;
        }
      }

      if (reviewedOnly && spot.review_count === 0) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        case "name":
          return a.spot_name.localeCompare(b.spot_name);
        case "rating":
          return (
            (b.average_rating ?? -1) - (a.average_rating ?? -1) ||
            b.review_count - a.review_count ||
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "distance":
          return (
            (a.distance_miles ?? Number.POSITIVE_INFINITY) -
              (b.distance_miles ?? Number.POSITIVE_INFINITY) ||
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "newest":
        default:
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
      }
    });

  const hasActiveFilters =
    selectedSpotType !== "all" || minimumRating !== "any" || reviewedOnly;

  return (
    <>
      <FloatingRightNav />
      <PageContainer>
        {/* Hero header */}
        <div className="mb-8 text-center">
          <Compass className="h-10 w-10 text-primary mx-auto mb-3" />
          <h1 className="text-3xl font-display text-foreground mb-2">
            Discover Study Spots
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Find trending, top-rated, and nearby study locations curated by the
            community.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm mb-8">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, type, or location..."
                className="pl-10 h-11 rounded-xl"
                value={searchInput}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setSearchInput(nextValue);
                  setLocationError("");

                  if (
                    selectedLocation &&
                    nextValue.trim() !== selectedLocation.label
                  ) {
                    setSelectedLocation(null);
                  }
                }}
                onFocus={() => {
                  if (locationSuggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                onBlur={() => {
                  window.setTimeout(() => setShowSuggestions(false), 150);
                }}
              />
              {searchInput && (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={clearLocationSearch}
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              {showSuggestions && (
                <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
                  {locationSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.text}
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-3 text-left text-sm hover:bg-accent"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleSelectSuggestion(suggestion)}
                    >
                      <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span>{suggestion.text}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button
              variant="outline"
              className="h-11 rounded-xl gap-2 shrink-0"
              onClick={handleUseCurrentLocation}
              disabled={locationLoading}
            >
              <Navigation className="h-4 w-4" />
              <span className="hidden sm:inline">
                {locationLoading ? "Locating..." : "Current Location"}
              </span>
            </Button>
            <div className="flex items-center gap-2 shrink-0">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <select
                className="h-11 rounded-xl border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={radiusMiles}
                onChange={(event) => setRadiusMiles(event.target.value)}
                disabled={!selectedLocation}
              >
                <option value="1">1 mile</option>
                <option value="3">3 miles</option>
                <option value="5">5 miles</option>
                <option value="10">10 miles</option>
                <option value="25">25 miles</option>
              </select>
            </div>
            <Button
              variant="outline"
              className="h-11 rounded-xl gap-2 shrink-0"
              onClick={() => setShowFilters((current) => !current)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {hasActiveFilters ? " (On)" : ""}
            </Button>
            <div className="flex items-center gap-2 shrink-0">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <select
                className="h-11 rounded-xl border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">A–Z</option>
                <option value="rating">Top Rated</option>
                <option value="distance">Nearest</option>
              </select>
            </div>
          </div>
          {showFilters && (
            <div className="mt-4 rounded-2xl border border-border bg-warm-50/40 p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Spot Type
                  </label>
                  <select
                    className="h-11 w-full rounded-xl border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    value={selectedSpotType}
                    onChange={(event) => setSelectedSpotType(event.target.value)}
                  >
                    <option value="all">All types</option>
                    {availableSpotTypes.map((spotType) => (
                      <option key={spotType} value={spotType}>
                        {spotType}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Minimum Rating
                  </label>
                  <select
                    className="h-11 w-full rounded-xl border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    value={minimumRating}
                    onChange={(event) => setMinimumRating(event.target.value)}
                  >
                    <option value="any">Any rating</option>
                    <option value="4.5">4.5+</option>
                    <option value="4">4.0+</option>
                    <option value="3.5">3.5+</option>
                    <option value="3">3.0+</option>
                  </select>
                </div>

                <label className="flex items-center gap-3 rounded-xl border border-input bg-background px-3 py-3 text-sm text-foreground md:self-end">
                  <input
                    type="checkbox"
                    checked={reviewedOnly}
                    onChange={(event) => setReviewedOnly(event.target.checked)}
                    className="h-4 w-4 rounded border-border"
                  />
                  Only show spots with reviews
                </label>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedSpotType("all");
                    setMinimumRating("any");
                    setReviewedOnly(false);
                  }}
                  disabled={!hasActiveFilters}
                >
                  Clear Filters
                </Button>
                <p className="text-xs text-muted-foreground">
                  Filter results by type, rating, and whether the spot has any reviews.
                </p>
              </div>
            </div>
          )}
          <div className="mt-3 flex flex-col gap-1 text-sm">
            {selectedLocation ? (
              <p className="text-muted-foreground">
                Searching within {radiusMiles} mile
                {radiusMiles === "1" ? "" : "s"} of{" "}
                <span className="font-medium text-foreground">
                  {selectedLocation.label}
                </span>
              </p>
            ) : debouncedSearchInput ? (
              <p className="text-muted-foreground">
                Showing results for{" "}
                <span className="font-medium text-foreground">
                  {debouncedSearchInput}
                </span>
              </p>
            ) : (
              <p className="text-muted-foreground">
                Search by spot name, type, address, or choose a place from
                Google Maps.
              </p>
            )}
            {locationError && (
              <p className="text-destructive">{locationError}</p>
            )}
            {!selectedLocation && (
              <p className="text-muted-foreground">
                Choose a Google place or use your current location to enable
                radius filtering from the miles dropdown.
              </p>
            )}
            {!import.meta.env.VITE_GOOGLE_MAPS_API_KEY && (
              <p className="text-muted-foreground">
                Add `VITE_GOOGLE_MAPS_API_KEY` in `frontend/.env.local` to
                enable Google location suggestions and reverse geocoding.
              </p>
            )}
          </div>
        </div>

        {/* Content area */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SpotCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 max-w-md mx-auto">
              <p className="text-destructive font-medium mb-2">
                Something went wrong
              </p>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button
                onClick={() => setRefreshKey((current) => current + 1)}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            </div>
          </div>
        ) : visibleSpots.length === 0 ? (
          <div className="text-center py-16">
            <div className="rounded-2xl border border-border bg-card p-10 max-w-md mx-auto shadow-sm">
              <MapPin className="h-12 w-12 text-warm-300 mx-auto mb-4" />
              <h3 className="text-xl font-display text-foreground mb-2">
                No matching study spots
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Try adjusting your search, location, or filters to see more results.
              </p>
              {hasActiveFilters ? (
                <Button
                  onClick={() => {
                    setSelectedSpotType("all");
                    setMinimumRating("any");
                    setReviewedOnly(false);
                  }}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Clear Filters
                </Button>
              ) : (
                isLoggedIn ? (
                  <Button asChild className="gap-2">
                    <Link to="/add-spot">
                      <Plus className="h-4 w-4" />
                      Add a Spot
                    </Link>
                  </Button>
                ) : null
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleSpots.map((spot) => (
                <SpotCard
                  key={spot.spot_id}
                  spot={spot}
                  isLoggedIn={isLoggedIn}
                  showAddress={isLoggedIn}
                  isOwner={user?.userId === spot.user_id}
                  favoritePending={favoritePendingIds.includes(spot.spot_id)}
                  onDelete={(spotId) => {
                    const target = visibleSpots.find((s) => s.spot_id === spotId);
                    if (target) setDeleteTarget(target);
                  }}
                  onEdit={(spotId) => {
                    // TODO: Navigate to edit page or open edit modal
                    console.log("Edit spot:", spotId);
                  }}
                  onViewDetails={handleViewDetails}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                Showing{" "}
                <span className="font-semibold text-foreground">
                  {visibleSpots.length}
                </span>{" "}
                study spot{visibleSpots.length !== 1 ? "s" : ""}
              </p>
            </div>
          </>
        )}

        {deleteTarget && (
          <DeleteSpotModal
            open={!!deleteTarget}
            onOpenChange={(open) => {
              if (!open) setDeleteTarget(null);
            }}
            spotName={deleteTarget.spot_name}
            onConfirm={() => handleDeleteSpot(deleteTarget.spot_id)}
          />
        )}
      </PageContainer>
    </>
  );
}
