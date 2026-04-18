import { createFileRoute, Link } from "@tanstack/react-router";
import { PageContainer } from "@/components/PageContainer";
import { FloatingRightNav } from "@/components/FloatingRightNav";
import { SectionCard } from "@/components/SectionCard";
import { importGoogleMapsLibrary } from "@/lib/google-maps";
import { getGoogleMapsEmbedUrl } from "@/lib/google-maps-urls";
import { SPOT_TYPES } from "@/lib/spot-types";
import {
  ATTRIBUTE_TYPE_OPTIONS,
  getAttributeTypeLabel,
  parseDelimitedValues,
} from "@/lib/attributes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUpload } from "@/components/FileUpload";
import {
  PlusCircle,
  MapPin,
  Navigation,
  Search,
  ChevronDown,
  ChevronUp,
  Loader2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  OperatingHoursSection,
  createDefaultHours,
  type DayHours,
} from "@/components/OperatingHoursSection";
import { useAuth } from "@/contexts/AuthContext";
import { getUserFriendlyErrorMessage } from "@/lib/error-message";
import { prepareImageUpload } from "@/lib/image-upload";
import { getAttributeMenu } from "@/server/attributes";
import { uploadSpotMedia } from "@/server/media";
import { createSpot } from "@/server/spots";
import type { AttributeDefinition } from "@/types/api";

export interface CreateSpotData {
  spot_name: string;
  spot_type: string;
  short_description: string;
  address: string;
  latitude: string;
  longitude: string;
  status: "active" | "inactive" | "pending";
}

type SelectedAttributeDraft = {
  attribute_id: number;
  value: string;
  notes: string;
};

type CustomAttributeDraft = {
  name: string;
  attribute_type: (typeof ATTRIBUTE_TYPE_OPTIONS)[number]["value"];
  suggested_allowed_values: string[];
  suggested_allowed_values_text: string;
  value: string;
  notes: string;
};

export const Route = createFileRoute("/add-spot")({
  component: AddSpotPage,
});

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

function getMinutesFromRange(
  hour: string,
  minute: string,
  meridiem: "AM" | "PM",
) {
  let parsedHour = Number.parseInt(hour, 10);

  if (meridiem === "AM" && parsedHour === 12) {
    parsedHour = 0;
  } else if (meridiem === "PM" && parsedHour !== 12) {
    parsedHour += 12;
  }

  return parsedHour * 60 + Number.parseInt(minute, 10);
}

function isBlankTimeRange(range: DayHours["timeRanges"][number]) {
  return (
    range.openHour === "" &&
    range.openMinute === "" &&
    range.openMeridiem === "" &&
    range.closeHour === "" &&
    range.closeMinute === "" &&
    range.closeMeridiem === ""
  );
}

function getOperatingHoursError(hours: DayHours[]) {
  for (const dayHours of hours) {
    if (dayHours.closed) {
      continue;
    }

    for (const range of dayHours.timeRanges) {
      if (isBlankTimeRange(range)) {
        continue;
      }

      const isPartialRange =
        range.openHour === "" ||
        range.openMinute === "" ||
        range.openMeridiem === "" ||
        range.closeHour === "" ||
        range.closeMinute === "" ||
        range.closeMeridiem === "";

      if (isPartialRange) {
        return `${dayHours.day}: complete both open and close times or leave the range blank.`;
      }

      const openMinutes = getMinutesFromRange(
        range.openHour,
        range.openMinute,
        range.openMeridiem as "AM" | "PM",
      );
      const closeMinutes = getMinutesFromRange(
        range.closeHour,
        range.closeMinute,
        range.closeMeridiem as "AM" | "PM",
      );

      if (closeMinutes <= openMinutes) {
        return `${dayHours.day}: closing time must be after opening time.`;
      }
    }
  }

  return null;
}

function renderAttributeValueInput(params: {
  attribute?: AttributeDefinition;
  attributeType?: (typeof ATTRIBUTE_TYPE_OPTIONS)[number]["value"];
  allowedValues?: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const attributeType = params.attribute?.attribute_type ?? params.attributeType;
  const allowedValues =
    params.allowedValues ?? params.attribute?.allowed_values ?? [];

  if (!attributeType) {
    return (
      <Input
        value={params.value}
        onChange={(event) => params.onChange(event.target.value)}
        placeholder={params.placeholder ?? "Enter a value"}
        className="h-11 rounded-xl"
      />
    );
  }

  if (attributeType === "boolean" || attributeType === "single_choice") {
    const options =
      attributeType === "boolean" ? ["Yes", "No"] : allowedValues;

    return (
      <Select value={params.value} onValueChange={params.onChange}>
        <SelectTrigger className="h-11 rounded-xl">
          <SelectValue placeholder="Choose a value" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Input
      type={attributeType === "number" ? "number" : "text"}
      value={params.value}
      onChange={(event) => params.onChange(event.target.value)}
      placeholder={params.placeholder ?? "Enter a value"}
      className="h-11 rounded-xl"
    />
  );
}

function AddSpotPage() {
  const { user, isLoggedIn } = useAuth();

  const [formData, setFormData] = useState<CreateSpotData>({
    spot_name: "",
    spot_type: "",
    short_description: "",
    address: "",
    latitude: "",
    longitude: "",
    status: "pending",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [locationError, setLocationError] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<
    LocationSuggestion[]
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [operatingHours, setOperatingHours] = useState<DayHours[]>(createDefaultHours());
  const [photoFiles, setPhotoFiles] = useState<Array<File | null>>([
    null,
    null,
    null,
    null,
    null,
  ]);
  const [attributeMenu, setAttributeMenu] = useState<AttributeDefinition[]>([]);
  const [attributeLoading, setAttributeLoading] = useState(true);
  const [attributeError, setAttributeError] = useState("");
  const [selectedAttributes, setSelectedAttributes] = useState<
    SelectedAttributeDraft[]
  >([]);
  const [editingSelectedAttributeIndex, setEditingSelectedAttributeIndex] =
    useState<number | null>(null);
  const [customAttributes, setCustomAttributes] = useState<CustomAttributeDraft[]>(
    [],
  );
  const [editingCustomAttributeIndex, setEditingCustomAttributeIndex] = useState<
    number | null
  >(null);
  const [newAttributeId, setNewAttributeId] = useState("");
  const [newAttributeValue, setNewAttributeValue] = useState("");
  const [newAttributeNotes, setNewAttributeNotes] = useState("");
  const [customAttributeDraft, setCustomAttributeDraft] =
    useState<CustomAttributeDraft>({
      name: "",
      attribute_type: "unsure",
      suggested_allowed_values: [],
      suggested_allowed_values_text: "",
      value: "",
      notes: "",
    });
  const sessionTokenRef = useRef<unknown>(null);
  const availableAttributes = attributeMenu.filter(
    (attribute) =>
      attribute.is_active &&
      !selectedAttributes.some(
        (selected, index) =>
          selected.attribute_id === attribute.attribute_id &&
          index !== editingSelectedAttributeIndex,
      ),
  );
  const selectedAttributeDefinition = attributeMenu.find(
    (attribute) => String(attribute.attribute_id) === newAttributeId,
  );
  const customAttributeSuggestions = customAttributeDraft.name.trim()
    ? attributeMenu.filter((attribute) =>
        attribute.name
          .toLowerCase()
          .includes(customAttributeDraft.name.trim().toLowerCase()),
      )
    : [];
  const customDraftAllowedValues =
    customAttributeDraft.attribute_type === "single_choice"
      ? parseDelimitedValues(customAttributeDraft.suggested_allowed_values_text)
      : [];

  const resetCustomAttributeDraft = () => {
    setCustomAttributeDraft({
      name: "",
      attribute_type: "unsure",
      suggested_allowed_values: [],
      suggested_allowed_values_text: "",
      value: "",
      notes: "",
    });
    setEditingCustomAttributeIndex(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  useEffect(() => {
    async function loadAttributes() {
      try {
        setAttributeLoading(true);
        setAttributeError("");
        const attributes = await getAttributeMenu();

        if (!Array.isArray(attributes)) {
          throw new Error("The attribute list returned an unexpected response.");
        }

        setAttributeMenu(attributes);
      } catch (loadError) {
        setAttributeMenu([]);
        setAttributeError(
          getUserFriendlyErrorMessage(
            loadError,
            "We couldn't load the available attributes.",
          ),
        );
      } finally {
        setAttributeLoading(false);
      }
    }

    void loadAttributes();
  }, []);

  useEffect(() => {
    const inputValue = formData.address.trim();

    if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY || !inputValue) {
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
  }, [formData.address]);

  const selectSpotType = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      spot_type: value,
    }));
  };

  const handleSelectLocationSuggestion = async (
    suggestion: LocationSuggestion,
  ) => {
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

      setFormData((prev) => ({
        ...prev,
        address: place.formattedAddress || place.displayName || suggestion.text,
        latitude: String(lat),
        longitude: String(lng),
      }));
      setLocationSuggestions([]);
      setShowSuggestions(false);
      sessionTokenRef.current = null;
    } catch (err) {
      setLocationError(
        getUserFriendlyErrorMessage(
          err,
          "We couldn't resolve that address from Google Maps.",
        ),
      );
    } finally {
      setLocationLoading(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Your browser does not support current location.");
      return;
    }

    setLocationError("");
    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        let address = "Current location";

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
              location: { lat: latitude, lng: longitude },
            });
            address = response.results?.[0]?.formatted_address || address;
          }
        } catch {
          address = "Current location";
        }

        setFormData((prev) => ({
          ...prev,
          address,
          latitude: String(latitude),
          longitude: String(longitude),
        }));
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

  const clearLocation = () => {
    setFormData((prev) => ({
      ...prev,
      address: "",
      latitude: "",
      longitude: "",
    }));
    setLocationError("");
    setLocationSuggestions([]);
    setShowSuggestions(false);
  };

  const handleAddExistingAttribute = () => {
    if (!selectedAttributeDefinition) {
      setError("Choose an approved attribute before adding it.");
      return;
    }

    if (!newAttributeValue.trim()) {
      setError(`Choose a value for ${selectedAttributeDefinition.name}.`);
      return;
    }

    const nextAttribute = {
      attribute_id: selectedAttributeDefinition.attribute_id,
      value: newAttributeValue.trim(),
      notes: newAttributeNotes.trim(),
    };

    setSelectedAttributes((current) => {
      if (editingSelectedAttributeIndex === null) {
        return [...current, nextAttribute];
      }

      return current.map((attribute, index) =>
        index === editingSelectedAttributeIndex ? nextAttribute : attribute,
      );
    });
    setNewAttributeId("");
    setNewAttributeValue("");
    setNewAttributeNotes("");
    setEditingSelectedAttributeIndex(null);
    setError("");
  };

  const resetSelectedAttributeDraft = () => {
    setNewAttributeId("");
    setNewAttributeValue("");
    setNewAttributeNotes("");
    setEditingSelectedAttributeIndex(null);
  };

  const startEditingSelectedAttribute = (index: number) => {
    setEditingSelectedAttributeIndex(index);
    setError("");
  };

  useEffect(() => {
    if (editingSelectedAttributeIndex === null) {
      return;
    }

    const attribute = selectedAttributes[editingSelectedAttributeIndex];
    if (!attribute) {
      resetSelectedAttributeDraft();
      return;
    }

    setNewAttributeId(String(attribute.attribute_id));
    setNewAttributeValue(attribute.value);
    setNewAttributeNotes(attribute.notes);
  }, [editingSelectedAttributeIndex, selectedAttributes]);

  const handleAddCustomAttribute = () => {
    if (!customAttributeDraft.name.trim() || !customAttributeDraft.value.trim()) {
      setError("Custom attributes need a name and value.");
      return;
    }

    if (
      customAttributeDraft.attribute_type === "single_choice" &&
      customDraftAllowedValues.length === 0
    ) {
      setError("Single-choice custom attributes need suggested options.");
      return;
    }

    if (
      customAttributeDraft.attribute_type === "single_choice" &&
      !customDraftAllowedValues.includes(customAttributeDraft.value.trim())
    ) {
      setError("Pick a value from the suggested single-choice options.");
      return;
    }

    const nextAttribute = {
      name: customAttributeDraft.name.trim(),
      attribute_type: customAttributeDraft.attribute_type,
      suggested_allowed_values: customDraftAllowedValues,
      suggested_allowed_values_text:
        customAttributeDraft.attribute_type === "single_choice"
          ? customDraftAllowedValues.join(", ")
          : "",
      value: customAttributeDraft.value.trim(),
      notes: customAttributeDraft.notes.trim(),
    };

    setCustomAttributes((current) => {
      if (editingCustomAttributeIndex === null) {
        return [...current, nextAttribute];
      }

      return current.map((attribute, index) =>
        index === editingCustomAttributeIndex ? nextAttribute : attribute,
      );
    });
    resetCustomAttributeDraft();
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!isLoggedIn || !user) {
        throw new Error("You must be signed in to add a spot.");
      }

      if (!formData.spot_name || !formData.spot_type) {
        throw new Error("Spot name and type are required.");
      }

      if (
        !formData.address.trim() ||
        !formData.latitude.trim() ||
        !formData.longitude.trim()
      ) {
        throw new Error(
          "Location is required. Choose an address suggestion or use your current location.",
        );
      }

      const operatingHoursError = getOperatingHoursError(operatingHours);
      if (operatingHoursError) {
        throw new Error(operatingHoursError);
      }

      const result = await createSpot({
        data: {
          userId: user.userId,
          ...formData,
          operatingHours,
          selectedAttributes,
          customAttributes,
        },
      });

      if (result?.success) {
        const selectedPhotos = photoFiles.filter((file): file is File => file !== null);
        let successMessage =
          "Spot submitted successfully! Thanks for contributing. It is now pending review.";

        if (selectedPhotos.length > 0) {
          try {
            const preparedImages = await Promise.all(
              selectedPhotos.map((file) => prepareImageUpload(file)),
            );

            await uploadSpotMedia({
              data: {
                userId: user.userId,
                spotId: result.spotId,
                images: preparedImages,
              },
            });
          } catch {
            successMessage =
              "Spot submitted successfully, but one or more photos could not be uploaded.";
          }
        }

        toast.success(successMessage);
        setFormData({
          spot_name: "",
          spot_type: "",
          short_description: "",
          address: "",
          latitude: "",
          longitude: "",
          status: "pending",
        });
        setOperatingHours(createDefaultHours());
        setPhotoFiles([null, null, null, null, null]);
        setSelectedAttributes([]);
        resetSelectedAttributeDraft();
        setCustomAttributes([]);
        setEditingCustomAttributeIndex(null);
        resetCustomAttributeDraft();
      }
    } catch (err) {
      toast.error(
        getUserFriendlyErrorMessage(
          err,
          "Something went wrong while adding the spot.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <>
        <FloatingRightNav />
        <PageContainer>
          <div className="text-center py-16">
            <div className="rounded-2xl border border-border bg-card p-10 max-w-md mx-auto shadow-sm">
              <PlusCircle className="h-12 w-12 text-warm-300 mx-auto mb-4" />
              <h2 className="text-xl font-display text-foreground mb-2">
                Sign in to add a spot
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                You need to be signed in to share a study spot with the
                community.
              </p>
              <Button asChild>
                <Link to="/signin">Sign In</Link>
              </Button>
            </div>
          </div>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <FloatingRightNav />
      <PageContainer>
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <PlusCircle className="h-10 w-10 text-primary mx-auto mb-3" />
            <h1 className="text-3xl font-display text-foreground mb-2">
              Add a Study Spot
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Know a great place to study? Share it with the MySpot community
              and help others discover it.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ─── Section 1: Basic Information ─── */}
            <SectionCard
              title="Basic Information"
              description="Tell us about this study spot."
            >
              <div className="space-y-5">
                {/* Spot Name */}
                <div>
                  <label
                    htmlFor="spot_name"
                    className="block text-sm font-medium text-foreground mb-1.5"
                  >
                    Spot Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="text"
                    id="spot_name"
                    name="spot_name"
                    value={formData.spot_name}
                    onChange={handleInputChange}
                    placeholder="e.g., The Daily Grind Coffee House"
                    required
                    className="h-11 rounded-xl"
                  />
                </div>

                {/* Spot Type */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Spot Type <span className="text-destructive">*</span>
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {SPOT_TYPES.map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => selectSpotType(value)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-xs font-medium ${
                          formData.spot_type === value
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border bg-card text-muted-foreground hover:border-warm-300 hover:bg-warm-50"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Short Description */}
                <div>
                  <label
                    htmlFor="short_description"
                    className="block text-sm font-medium text-foreground mb-1.5"
                  >
                    Description
                  </label>
                  <Textarea
                    id="short_description"
                    name="short_description"
                    value={formData.short_description}
                    onChange={handleInputChange}
                    rows={3}
                    className="rounded-xl"
                    placeholder="Describe the atmosphere, noise level, amenities, power outlets, seating..."
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Help others know what to expect.
                  </p>
                </div>
              </div>
            </SectionCard>

            {/* ─── Section 2: Location ─── */}
            <SectionCard
              title="Location"
              description="Where is this study spot? We'll use this for discovery."
            >
              <div className="space-y-4">
                {/* Address search */}
                <div>
                  <label
                    htmlFor="address"
                    className="block text-sm font-medium text-foreground mb-1.5"
                  >
                    Address <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={(event) => {
                        handleInputChange(event);
                        setLocationError("");
                        setFormData((prev) => ({
                          ...prev,
                          latitude: "",
                          longitude: "",
                        }));
                      }}
                      onFocus={() => {
                        if (locationSuggestions.length > 0) {
                          setShowSuggestions(true);
                        }
                      }}
                      onBlur={() => {
                        window.setTimeout(() => setShowSuggestions(false), 150);
                      }}
                      placeholder="Search for an address..."
                      required
                      className="pl-10 h-11 rounded-xl"
                    />
                    {locationLoading ? (
                      <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                    ) : formData.address ? (
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={clearLocation}
                        aria-label="Clear address"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                  {showSuggestions && (
                    <div className="mt-2 overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
                      {locationSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.text}
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-3 text-left text-sm hover:bg-accent"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() =>
                            void handleSelectLocationSuggestion(suggestion)
                          }
                        >
                          <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span>{suggestion.text}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Start typing and choose a suggestion, or use your current location.
                  </p>
                </div>

                {/* Use current location */}
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 rounded-xl"
                  onClick={handleUseCurrentLocation}
                  disabled={locationLoading}
                >
                  <Navigation className="h-4 w-4" />
                  {locationLoading ? "Locating..." : "Use Current Location"}
                </Button>

                {/* Selected location preview */}
                {formData.address && (
                  <div className="rounded-xl border border-border bg-warm-50 p-4 flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {formData.address}
                      </p>
                      {formData.latitude && formData.longitude ? (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {Number(formData.latitude).toFixed(6)},{" "}
                          {Number(formData.longitude).toFixed(6)}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Coordinates will be resolved automatically
                        </p>
                      )}
                      {import.meta.env.VITE_GOOGLE_MAPS_API_KEY &&
                        formData.latitude &&
                        formData.longitude && (
                          <div className="mt-3 h-40 overflow-hidden rounded-lg border border-border bg-background">
                            <iframe
                              title="Selected spot location preview"
                              className="h-full w-full border-0"
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                              src={getGoogleMapsEmbedUrl(
                                import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
                                Number(formData.latitude),
                                Number(formData.longitude),
                              )}
                            />
                          </div>
                        )}
                    </div>
                  </div>
                )}
                {locationError && (
                  <p className="text-sm text-destructive">{locationError}</p>
                )}
                {!import.meta.env.VITE_GOOGLE_MAPS_API_KEY && (
                  <p className="text-xs text-muted-foreground">
                    Add `VITE_GOOGLE_MAPS_API_KEY` in `frontend/.env.local` to
                    enable Google address suggestions and map previews.
                  </p>
                )}

                {/* Hidden lat/lng — populated by address picker or geolocation */}
                <input
                  type="hidden"
                  name="latitude"
                  value={formData.latitude}
                />
                <input
                  type="hidden"
                  name="longitude"
                  value={formData.longitude}
                />
              </div>
            </SectionCard>

            {/* ─── Section 3: Attributes ─── */}
            <SectionCard
              title="Attributes"
              description="Add the amenities and details that matter most for choosing this spot."
            >
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Approved Attributes
                  </label>
                  {attributeLoading ? (
                    <p className="text-sm text-muted-foreground">
                      Loading attributes...
                    </p>
                  ) : (
                    <div className="space-y-3 rounded-2xl border border-border bg-background/80 p-4">
                      <div className="grid gap-3 md:grid-cols-[1.2fr_1fr]">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-muted-foreground">
                            Attribute
                          </label>
                          <Select
                            value={newAttributeId}
                            onValueChange={(value) => {
                              const nextDefinition = attributeMenu.find(
                                (attribute) =>
                                  String(attribute.attribute_id) === value,
                              );
                              setNewAttributeId(value);
                              setNewAttributeValue(
                                nextDefinition?.allowed_values.includes(
                                  newAttributeValue,
                                )
                                  ? newAttributeValue
                                  : "",
                              );
                            }}
                          >
                            <SelectTrigger className="h-11 rounded-xl">
                              <SelectValue placeholder="Choose an approved attribute" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableAttributes.map((attribute) => (
                                <SelectItem
                                  key={attribute.attribute_id}
                                  value={String(attribute.attribute_id)}
                                >
                                  {attribute.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-muted-foreground">
                            Value
                          </label>
                          {renderAttributeValueInput({
                            attribute: selectedAttributeDefinition,
                            value: newAttributeValue,
                            onChange: setNewAttributeValue,
                          })}
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-muted-foreground">
                          Notes
                        </label>
                        <Input
                          value={newAttributeNotes}
                          onChange={(event) => setNewAttributeNotes(event.target.value)}
                          placeholder="Optional detail for this spot"
                          className="h-11 rounded-xl"
                        />
                      </div>
                      {selectedAttributeDefinition?.help_text ? (
                        <p className="text-xs text-muted-foreground">
                          {selectedAttributeDefinition.help_text}
                        </p>
                      ) : null}
                      <div className="flex flex-wrap gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-xl"
                          onClick={handleAddExistingAttribute}
                          disabled={!selectedAttributeDefinition}
                        >
                          {editingSelectedAttributeIndex === null
                            ? "Add Approved Attribute"
                            : "Update Approved Attribute"}
                        </Button>
                        {editingSelectedAttributeIndex !== null ? (
                          <Button
                            type="button"
                            variant="ghost"
                            className="rounded-xl"
                            onClick={resetSelectedAttributeDraft}
                          >
                            Cancel Editing
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>

                {selectedAttributes.length > 0 ? (
                  <div className="space-y-2">
                    {selectedAttributes.map((attribute, index) => {
                      const definition = attributeMenu.find(
                        (menuAttribute) =>
                          menuAttribute.attribute_id === attribute.attribute_id,
                      );

                      if (!definition) {
                        return null;
                      }

                      return (
                        <div
                          key={`${attribute.attribute_id}-${index}`}
                          className="rounded-2xl border border-border bg-card p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-foreground">
                                {definition.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {attribute.value}
                                {attribute.notes ? ` • ${attribute.notes}` : ""}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                className="text-xs font-medium text-foreground hover:underline"
                                onClick={() => startEditingSelectedAttribute(index)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="text-xs font-medium text-destructive hover:underline"
                                onClick={() =>
                                  setSelectedAttributes((current) =>
                                    current.filter((_, currentIndex) => currentIndex !== index),
                                  )
                                }
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Suggest a Custom Attribute
                  </label>
                  <div className="space-y-3 rounded-2xl border border-dashed border-warm-300 bg-warm-50/60 p-4">
                    <div className="grid gap-3 md:grid-cols-[1.2fr_1fr]">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-muted-foreground">
                          Attribute Name
                        </label>
                        <Input
                          value={customAttributeDraft.name}
                          onChange={(event) =>
                            setCustomAttributeDraft((current) => ({
                              ...current,
                              name: event.target.value,
                            }))
                          }
                          placeholder="e.g., Reservation Required"
                          className="h-11 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-muted-foreground">
                          Suggested Type
                        </label>
                        <Select
                          value={customAttributeDraft.attribute_type}
                          onValueChange={(value) =>
                            setCustomAttributeDraft((current) => ({
                              ...current,
                              attribute_type:
                                value as CustomAttributeDraft["attribute_type"],
                              suggested_allowed_values:
                                value === "single_choice"
                                  ? current.suggested_allowed_values
                                  : [],
                              suggested_allowed_values_text:
                                value === "single_choice"
                                  ? current.suggested_allowed_values_text
                                  : "",
                              value: "",
                            }))
                          }
                        >
                          <SelectTrigger className="h-11 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ATTRIBUTE_TYPE_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {customAttributeSuggestions.length > 0 ? (
                      <div className="rounded-xl border border-border bg-card p-3">
                        <p className="text-xs font-medium text-foreground">
                          Similar approved attributes
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {customAttributeSuggestions.slice(0, 4).map((attribute) => (
                            <button
                              key={attribute.attribute_id}
                              type="button"
                              className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground hover:border-primary hover:text-primary"
                              onClick={() => {
                                setNewAttributeId(String(attribute.attribute_id));
                                setCustomAttributeDraft((current) => ({
                                  ...current,
                                  name: "",
                                }));
                              }}
                            >
                              Use {attribute.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    <div>
                      {customAttributeDraft.attribute_type === "single_choice" ? (
                        <div className="mb-3">
                          <label className="mb-1 block text-xs font-medium text-muted-foreground">
                            Suggested Choices
                          </label>
                          <Input
                            value={customAttributeDraft.suggested_allowed_values_text}
                            onChange={(event) =>
                              setCustomAttributeDraft((current) => ({
                                ...current,
                                suggested_allowed_values_text: event.target.value,
                                suggested_allowed_values: parseDelimitedValues(
                                  event.target.value,
                                ),
                                value: parseDelimitedValues(event.target.value).includes(
                                  current.value,
                                )
                                  ? current.value
                                  : "",
                              }))
                            }
                            placeholder="Comma-separated choices, e.g., Silent, Moderate, Lively"
                            className="h-11 rounded-xl"
                          />
                          <p className="mt-1 text-xs text-muted-foreground">
                            These are suggestions for the admin reviewer.
                          </p>
                        </div>
                      ) : null}
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Value
                      </label>
                      {renderAttributeValueInput({
                        attributeType: customAttributeDraft.attribute_type,
                        allowedValues: customDraftAllowedValues,
                        value: customAttributeDraft.value,
                        onChange: (value) =>
                          setCustomAttributeDraft((current) => ({
                            ...current,
                            value,
                          })),
                        placeholder: "Enter the value for this spot",
                      })}
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Notes
                      </label>
                      <Input
                        value={customAttributeDraft.notes}
                        onChange={(event) =>
                          setCustomAttributeDraft((current) => ({
                            ...current,
                            notes: event.target.value,
                          }))
                        }
                        placeholder="Optional context for the admin reviewer"
                        className="h-11 rounded-xl"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Custom attributes stay attached to this pending spot. An admin
                      will review and standardize them before approval.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl"
                        onClick={handleAddCustomAttribute}
                      >
                        {editingCustomAttributeIndex === null
                          ? "Add Custom Attribute"
                          : "Update Custom Attribute"}
                      </Button>
                      {editingCustomAttributeIndex !== null ? (
                        <Button
                          type="button"
                          variant="ghost"
                          className="rounded-xl"
                          onClick={resetCustomAttributeDraft}
                        >
                          Cancel Editing
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>

                {customAttributes.length > 0 ? (
                  <div className="space-y-2">
                    {customAttributes.map((attribute, index) => (
                      <div
                        key={`${attribute.name}-${index}`}
                        className="rounded-2xl border border-warm-200 bg-warm-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {attribute.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {getAttributeTypeLabel(attribute.attribute_type)} •{" "}
                              {attribute.value}
                              {attribute.attribute_type === "single_choice" &&
                              attribute.suggested_allowed_values.length > 0
                                ? ` • Choices: ${attribute.suggested_allowed_values.join(", ")}`
                                : ""}
                              {attribute.notes ? ` • ${attribute.notes}` : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              className="text-xs font-medium text-foreground hover:underline"
                              onClick={() => {
                                setCustomAttributeDraft(attribute);
                                setEditingCustomAttributeIndex(index);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="text-xs font-medium text-destructive hover:underline"
                              onClick={() =>
                                setCustomAttributes((current) =>
                                  current.filter((_, currentIndex) => currentIndex !== index),
                                )
                              }
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {error ? (
                  <p className="text-sm text-destructive">{error}</p>
                ) : null}
                {attributeError ? (
                  <p className="text-sm text-destructive">{attributeError}</p>
                ) : null}
              </div>
            </SectionCard>

            {/* ─── Section 4: Operating Hours ─── */}
            <OperatingHoursSection
              hours={operatingHours}
              onChange={setOperatingHours}
            />

            {/* ─── Section 5: Photos ─── */}
            <SectionCard
              title="Photos"
              description="Add images after the details are in place so others can recognize the spot."
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {photoFiles.map((photo, index) => (
                    <FileUpload
                      key={index}
                      label={index === 0 ? "Primary photo" : `Photo ${index + 1}`}
                      onFileSelect={(file) => {
                        setPhotoFiles((prev) => {
                          const next = [...prev];
                          next[index] = file;
                          return next;
                        });
                      }}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload up to 5 photos. Anything over 1 MB will be compressed before upload.
                </p>
              </div>
            </SectionCard>

            {/* ─── Section 6: Advanced (collapsible) ─── */}
            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-warm-50/50 transition-colors"
              >
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Advanced Details
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Optional extras for unusual spot setups
                  </p>
                </div>
                {showAdvanced ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </button>

              {showAdvanced && (
                <div className="px-6 pb-6 space-y-5 border-t border-border pt-5">
                  {/* Parent Location */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Parent Location{" "}
                      <span className="text-muted-foreground font-normal">
                        (Optional)
                      </span>
                    </label>
                    <Input
                      type="text"
                      placeholder="Search for a parent location..."
                      className="h-11 rounded-xl"
                      disabled
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Use this if this study spot belongs inside a larger place,
                      building, or area.
                    </p>
                    {/* TODO: Add parent spot selector backed by spots search (parent_spot_id) */}
                  </div>
                </div>
              )}
            </div>

            {/* ─── Submit area ─── */}
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sticky bottom-4">
              <p className="text-xs text-muted-foreground hidden sm:block">
                <span className="text-destructive">*</span> indicates required
                fields
              </p>
              <div className="flex gap-3 ml-auto">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => {
                    setFormData({
                      spot_name: "",
                      spot_type: "",
                      short_description: "",
                      address: "",
                      latitude: "",
                      longitude: "",
                      status: "pending",
                    });
                    setError("");
                    setOperatingHours(createDefaultHours());
                    setSelectedAttributes([]);
                    setCustomAttributes([]);
                    resetSelectedAttributeDraft();
                    resetCustomAttributeDraft();
                  }}
                >
                  Reset
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl gap-2 px-6"
                >
                  {loading ? (
                    "Creating..."
                  ) : (
                    <>
                      <PlusCircle className="h-4 w-4" />
                      Add Study Spot
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </PageContainer>
    </>
  );
}
