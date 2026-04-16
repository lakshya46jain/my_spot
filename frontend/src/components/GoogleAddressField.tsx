import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { importGoogleMapsLibrary } from "@/lib/google-maps";
import { getUserFriendlyErrorMessage } from "@/lib/error-message";

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

interface GoogleAddressFieldProps {
  value: string;
  onChange: (value: string) => void;
  onLocationResolved: (location: {
    address: string;
    latitude: string;
    longitude: string;
  }) => void;
  placeholder?: string;
}

export function GoogleAddressField({
  value,
  onChange,
  onLocationResolved,
  placeholder = "Search with Google Maps",
}: GoogleAddressFieldProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const sessionTokenRef = useRef<unknown>(null);

  useEffect(() => {
    const inputValue = value.trim();

    if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY || !inputValue) {
      setSuggestions([]);
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

        const nextSuggestions = (response.suggestions ?? [])
          .slice(0, 5)
          .map((suggestion) => ({
            placePrediction: suggestion.placePrediction,
            text:
              suggestion.placePrediction?.text?.toString?.() ??
              "Unknown location",
          }))
          .filter((suggestion) => suggestion.text.trim().length > 0);

        setSuggestions(nextSuggestions);
        setShowSuggestions(nextSuggestions.length > 0);
      } catch {
        if (!cancelled) {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      }
    };

    const timeoutId = window.setTimeout(loadSuggestions, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [value]);

  const handleSelectSuggestion = async (suggestion: LocationSuggestion) => {
    try {
      setError("");
      setLoading(true);

      const place = suggestion.placePrediction.toPlace?.();

      if (!place) {
        throw new Error("Google Maps could not load this location.");
      }

      await place.fetchFields({
        fields: ["displayName", "formattedAddress", "location"],
      });

      const latitude = getCoordinateValue(place.location, "lat");
      const longitude = getCoordinateValue(place.location, "lng");

      if (latitude === null || longitude === null) {
        throw new Error("This place did not include coordinates.");
      }

      onLocationResolved({
        address: place.formattedAddress || place.displayName || suggestion.text,
        latitude: String(latitude),
        longitude: String(longitude),
      });
      setSuggestions([]);
      setShowSuggestions(false);
      sessionTokenRef.current = null;
    } catch (selectError) {
      setError(
        getUserFriendlyErrorMessage(
          selectError,
          "We couldn't resolve that address from Google Maps.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          onChange={(event) => {
            setError("");
            onChange(event.target.value);
          }}
          placeholder={placeholder}
          className="rounded-xl pl-9 pr-10"
        />
        {loading ? (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        ) : null}
      </div>
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : null}
      {showSuggestions ? (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.text}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              className="block w-full border-b border-border px-3 py-2 text-left text-sm text-foreground last:border-b-0 hover:bg-muted/40"
            >
              {suggestion.text}
            </button>
          ))}
        </div>
      ) : null}
      <p className="text-xs text-muted-foreground">
        Search with Google Maps to keep the saved address consistent.
      </p>
    </div>
  );
}
