import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/PageContainer";
import { FloatingRightNav } from "@/components/FloatingRightNav";
import { SpotCard } from "@/components/SpotCard";
import { SpotCardSkeleton } from "@/components/SpotCardSkeleton";
import { DeleteSpotModal } from "@/components/DeleteSpotModal";
import { useAuth } from "@/contexts/AuthContext";
import { getUserFriendlyErrorMessage } from "@/lib/error-message";
import {
  Compass,
  MapPin,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Navigation,
  Plus,
  RefreshCw,
} from "lucide-react";
import { useState, useEffect } from "react";
import { getSpots, deleteSpot } from "@/server/spots";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@tanstack/react-router";

export interface Spot {
  spot_id: number;
  spot_name: string;
  spot_type: string;
  short_description: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  status: "active" | "inactive" | "pending";
  created_at: string;
  last_modified: string | null;
  creator_name: string;
  user_id: number;
}

export const Route = createFileRoute("/explore")({
  component: ExplorePage,
});

function ExplorePage() {
  const { isLoggedIn, user } = useAuth();
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Spot | null>(null);

  useEffect(() => {
    fetchSpots();
  }, []);

  const fetchSpots = async () => {
    try {
      setLoading(true);
      setError("");
      const result = await getSpots();
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

  const handleDeleteSpot = async (spotId: number) => {
    try {
      const result = await deleteSpot({
        data: {
          spotId,
        },
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
            {/* Location search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, type, or location..."
                className="pl-10 h-11 rounded-xl"
                // TODO: Integrate Google Maps Places autocomplete here
                // TODO: Wire search to filter getSpots results or add server-side search
              />
            </div>

            {/* Use current location */}
            <Button
              variant="outline"
              className="h-11 rounded-xl gap-2 shrink-0"
              onClick={() => {
                // TODO: Use browser Geolocation API and pass coords to location-based spot search
              }}
            >
              <Navigation className="h-4 w-4" />
              <span className="hidden sm:inline">Current Location</span>
            </Button>

            {/* Radius selector */}
            <div className="flex items-center gap-2 shrink-0">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <select
                className="h-11 rounded-xl border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                defaultValue="5"
                // TODO: Wire radius to location-based filtering
              >
                <option value="1">1 mile</option>
                <option value="3">3 miles</option>
                <option value="5">5 miles</option>
                <option value="10">10 miles</option>
                <option value="25">25 miles</option>
              </select>
            </div>

            {/* Filter button */}
            <Button
              variant="outline"
              className="h-11 rounded-xl gap-2 shrink-0"
              onClick={() => {
                // TODO: Open filter panel (spot type, attributes, rating, open now, etc.)
              }}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </Button>

            {/* Sort dropdown */}
            <div className="flex items-center gap-2 shrink-0">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <select
                className="h-11 rounded-xl border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                defaultValue="newest"
                // TODO: Wire sort to re-order spots (backend or client-side)
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">A–Z</option>
                <option value="rating">Top Rated</option>
                <option value="distance">Nearest</option>
              </select>
            </div>
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
              <Button onClick={fetchSpots} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            </div>
          </div>
        ) : spots.length === 0 ? (
          <div className="text-center py-16">
            <div className="rounded-2xl border border-border bg-card p-10 max-w-md mx-auto shadow-sm">
              <MapPin className="h-12 w-12 text-warm-300 mx-auto mb-4" />
              <h3 className="text-xl font-display text-foreground mb-2">
                No study spots yet
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Be the first to share a great place to study with the community!
              </p>
              <Button asChild className="gap-2">
                <Link to="/add-spot">
                  <Plus className="h-4 w-4" />
                  Add a Spot
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Spot grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {spots.map((spot) => (
                <SpotCard
                  key={spot.spot_id}
                  spot={spot}
                  isLoggedIn={isLoggedIn}
                  isOwner={user?.userId === spot.user_id}
                  onDelete={(spotId) => {
                    const target = spots.find((s) => s.spot_id === spotId);
                    if (target) setDeleteTarget(target);
                  }}
                  onEdit={(spotId) => {
                    // TODO: Navigate to edit page or open edit modal
                    console.log("Edit spot:", spotId);
                  }}
                  onViewDetails={(spotId) => {
                    // TODO: Navigate to spot detail page when implemented
                    console.log("View details:", spotId);
                  }}
                />
              ))}
            </div>

            {/* Results footer */}
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                Showing{" "}
                <span className="font-semibold text-foreground">
                  {spots.length}
                </span>{" "}
                study spot{spots.length !== 1 ? "s" : ""}
              </p>
            </div>
          </>
        )}

        {/* Delete modal */}
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
