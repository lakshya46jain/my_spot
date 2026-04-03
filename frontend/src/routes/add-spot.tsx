import { createFileRoute, Link } from "@tanstack/react-router";
import { PageContainer } from "@/components/PageContainer";
import { FloatingRightNav } from "@/components/FloatingRightNav";
import { SectionCard } from "@/components/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileUpload } from "@/components/FileUpload";
import {
  PlusCircle,
  MapPin,
  Navigation,
  Search,
  ImagePlus,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Coffee,
  BookOpen,
  Trees,
  UtensilsCrossed,
  Building2,
  MoreHorizontal,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createSpot } from "@/server/spots";

export interface CreateSpotData {
  spot_name: string;
  spot_type: string;
  short_description: string;
  address: string;
  latitude: string;
  longitude: string;
  status: "active" | "inactive" | "pending";
}

export const Route = createFileRoute("/add-spot")({
  component: AddSpotPage,
});

const SPOT_TYPES = [
  { value: "cafe", label: "Café", icon: Coffee },
  { value: "library", label: "Library", icon: BookOpen },
  { value: "park", label: "Park", icon: Trees },
  { value: "restaurant", label: "Restaurant", icon: UtensilsCrossed },
  { value: "office", label: "Office", icon: Building2 },
  { value: "other", label: "Other", icon: MoreHorizontal },
] as const;

function AddSpotPage() {
  const { user, isLoggedIn } = useAuth();

  const [formData, setFormData] = useState<CreateSpotData>({
    spot_name: "",
    spot_type: "",
    short_description: "",
    address: "",
    latitude: "",
    longitude: "",
    status: "active", // Hidden from user — defaults to active. TODO: change to "pending" for moderation flow
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const selectSpotType = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      spot_type: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (!isLoggedIn || !user) {
        throw new Error("You must be signed in to add a spot.");
      }

      if (!formData.spot_name || !formData.spot_type) {
        throw new Error("Spot name and type are required.");
      }

      const result = await createSpot({
        data: {
          userId: user.userId,
          ...formData,
        },
      });

      if (result?.success) {
        setMessage("Spot created successfully! Thank you for contributing.");
        setFormData({
          spot_name: "",
          spot_type: "",
          short_description: "",
          address: "",
          latitude: "",
          longitude: "",
          status: "active",
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
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
                  <textarea
                    id="short_description"
                    name="short_description"
                    value={formData.short_description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
                    Address
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Search for an address..."
                      className="pl-10 h-11 rounded-xl"
                    />
                  </div>
                  {/* TODO: Integrate Google Maps Places autocomplete here */}
                  {/* TODO: Resolve selected address into latitude/longitude automatically */}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Start typing to search, or use your current location.
                  </p>
                </div>

                {/* Use current location */}
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 rounded-xl"
                  onClick={() => {
                    // TODO: Use browser Geolocation API to get current position
                    // TODO: Reverse geocode coords to get address and populate fields
                  }}
                >
                  <Navigation className="h-4 w-4" />
                  Use Current Location
                </Button>

                {/* Selected location preview */}
                {formData.address && (
                  <div className="rounded-xl border border-border bg-warm-50 p-4 flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {formData.address}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Coordinates will be resolved automatically
                      </p>
                      {/* TODO: Show resolved lat/lng and mini map preview here */}
                    </div>
                  </div>
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

            {/* ─── Section 3: Media ─── */}
            <SectionCard
              title="Photos"
              description="Add images to help others recognize this spot."
            >
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {/* Primary upload */}
                  <FileUpload
                    onFileSelect={(file) => {
                      // TODO: Connect image upload UI to spot_media backend flow
                      console.log("Photo selected:", file);
                    }}
                  />

                  {/* Additional upload slots */}
                  {[1, 2].map((i) => (
                    <button
                      key={i}
                      type="button"
                      className="flex h-20 w-full items-center justify-center rounded-xl border-2 border-dashed border-warm-200 bg-warm-50/50 text-warm-300 hover:border-warm-300 hover:text-warm-400 transition-colors"
                      onClick={() => {
                        // TODO: Connect image upload UI to spot_media backend flow
                      }}
                    >
                      <ImagePlus className="h-6 w-6" />
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload up to 5 photos. Supported: JPG, PNG, WebP.
                </p>
                {/* TODO: Connect image upload UI to spot_media backend flow */}
              </div>
            </SectionCard>

            {/* ─── Section 4: Advanced (collapsible) ─── */}
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
                    Optional — parent location, attributes, hours
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

                  {/* Attributes placeholder */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Attributes
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "WiFi",
                        "Power Outlets",
                        "Quiet",
                        "Group-Friendly",
                        "Food Available",
                        "Outdoor Seating",
                      ].map((attr) => (
                        <span
                          key={attr}
                          className="px-3 py-1.5 rounded-full border border-warm-200 bg-warm-50 text-warm-400 text-xs font-medium cursor-not-allowed opacity-60"
                        >
                          {attr}
                        </span>
                      ))}
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      Attribute selection coming in the next phase.
                    </p>
                    {/* TODO: Add attributes and hours once backend wiring is implemented */}
                  </div>

                  {/* Hours placeholder */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Operating Hours
                    </label>
                    <div className="rounded-xl border border-border bg-warm-50/50 p-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        Hours management coming in the next phase.
                      </p>
                    </div>
                    {/* TODO: Add spot_hours form when backend is ready */}
                  </div>
                </div>
              )}
            </div>

            {/* ─── Messages ─── */}
            {message && (
              <div className="flex items-start gap-3 p-4 rounded-xl border border-green-200 bg-green-50">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    {message}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    <Link
                      to="/explore"
                      className="underline hover:text-green-800"
                    >
                      View all spots →
                    </Link>
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-3 p-4 rounded-xl border border-destructive/20 bg-destructive/5">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                <p className="text-sm font-medium text-destructive">{error}</p>
              </div>
            )}

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
                      status: "active",
                    });
                    setError("");
                    setMessage("");
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
