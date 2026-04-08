import { createFileRoute, Link } from "@tanstack/react-router";
import { PageContainer } from "@/components/PageContainer";
import { StarRating } from "@/components/StarRating";
import { ReportModal } from "@/components/ReportModal";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getSpot } from "@/server/spots";
import { getUserFriendlyErrorMessage } from "@/lib/error-message";
import type { Spot } from "@/types/api";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  MapPin,
  ExternalLink,
  Pencil,
  Flag,
  Clock,
  Coffee,
  BookOpen,
  Trees,
  UtensilsCrossed,
  Building2,
  MoreHorizontal,
  ImageOff,
  Send,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/spot/$spotId")({
  component: SpotDetailsPage,
});

// ─── Type helpers ──────────────────────────────────────────────
const SPOT_TYPE_ICONS: Record<string, React.ReactNode> = {
  cafe: <Coffee className="h-5 w-5" />,
  library: <BookOpen className="h-5 w-5" />,
  park: <Trees className="h-5 w-5" />,
  restaurant: <UtensilsCrossed className="h-5 w-5" />,
  office: <Building2 className="h-5 w-5" />,
};

const SPOT_TYPE_LABELS: Record<string, string> = {
  cafe: "Café",
  library: "Library",
  park: "Park",
  restaurant: "Restaurant",
  office: "Office",
};

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

// TODO: fetch real attributes from backend (spot_attributes table)
const PLACEHOLDER_ATTRIBUTES = ["WiFi", "Quiet", "Power Outlets"];

// Placeholder reviews — TODO: fetch reviews for this spot from reviews table
const PLACEHOLDER_REVIEWS = [
  {
    id: 1,
    name: "Alex M.",
    rating: 4,
    text: "Great atmosphere and solid WiFi. Gets a little busy in the afternoons but otherwise perfect for studying.",
    date: "2 days ago",
  },
  {
    id: 2,
    name: "Jordan P.",
    rating: 5,
    text: "My absolute favorite study spot! Friendly staff, great coffee, and plenty of outlets.",
    date: "1 week ago",
  },
  {
    id: 3,
    name: "Sam K.",
    rating: 3,
    text: "Decent spot but the seating can be uncomfortable for long sessions. Coffee is good though.",
    date: "2 weeks ago",
  },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── Main Component ──────────────────────────────────────────────
function SpotDetailsPage() {
  const { spotId: spotIdStr } = Route.useParams();
  const { isLoggedIn } = useAuth();
  const spotId = Number(spotIdStr);

  const [spot, setSpot] = useState<Spot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Carousel state
  const [currentSlide, setCurrentSlide] = useState(0);
  const placeholderSlides = 4; // TODO: connect spot media carousel to spot_media API

  // Report modals
  const [reportSpotOpen, setReportSpotOpen] = useState(false);
  const [reportReviewTarget, setReportReviewTarget] = useState<number | null>(null);

  // Review composer
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        const result = await getSpot({ data: { spotId } });
        setSpot(result);
      } catch (err) {
        setError(
          getUserFriendlyErrorMessage(err, "Could not load spot details."),
        );
      } finally {
        setLoading(false);
      }
    }
    if (spotId) load();
  }, [spotId]);

  // TODO: fetch real aggregated rating value from reviews table
  const aggregatedRating = 4.0;

  const handleSubmitReview = () => {
    if (reviewRating === 0) return;
    // TODO: wire review submission to backend
    console.log("Submit review:", { spotId, rating: reviewRating, text: reviewText });
    setReviewRating(0);
    setReviewText("");
  };

  if (loading) {
    return (
      <PageContainer className="pr-0">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      </PageContainer>
    );
  }

  if (error || !spot) {
    return (
      <PageContainer className="pr-0">
        <div className="text-center py-16">
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 max-w-md mx-auto">
            <p className="text-destructive font-medium mb-2">
              {error || "Spot not found"}
            </p>
            <Button asChild className="gap-2 mt-4">
              <Link to="/explore">
                <ArrowLeft className="h-4 w-4" />
                Back to Explore
              </Link>
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  const typeIcon = SPOT_TYPE_ICONS[spot.spot_type] ?? (
    <MoreHorizontal className="h-5 w-5" />
  );
  const typeLabel = SPOT_TYPE_LABELS[spot.spot_type] ?? spot.spot_type;

    return (
      <PageContainer className="pr-0">
        {/* Back link */}
        <div className="mb-6">
          <Button asChild className="gap-2 rounded-xl shadow-sm">
            <Link to="/explore">
              <ArrowLeft className="h-4 w-4" />
              Back to Explore
            </Link>
          </Button>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* ─── Media Carousel ─── */}
          <div className="relative rounded-2xl overflow-hidden bg-warm-100 h-72 md:h-96 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-warm-400">
              <ImageOff className="h-14 w-14" />
              <span className="text-sm font-medium">
                Photo {currentSlide + 1} of {placeholderSlides}
              </span>
              <span className="text-xs text-warm-300">Media coming soon</span>
            </div>
            {/* TODO: connect spot media carousel to spot_media API */}

            {/* Navigation arrows */}
            <button
              onClick={() =>
                setCurrentSlide((prev) =>
                  prev === 0 ? placeholderSlides - 1 : prev - 1,
                )
              }
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-card/80 backdrop-blur-sm text-foreground hover:bg-card transition-colors shadow-md"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() =>
                setCurrentSlide((prev) =>
                  prev === placeholderSlides - 1 ? 0 : prev + 1,
                )
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-card/80 backdrop-blur-sm text-foreground hover:bg-card transition-colors shadow-md"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {Array.from({ length: placeholderSlides }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === currentSlide
                      ? "w-6 bg-primary"
                      : "w-2 bg-card/60"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* ─── Spot Info ─── */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1 min-w-0">
                {/* Category */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-warm-500">{typeIcon}</span>
                  <span className="text-sm font-medium text-muted-foreground capitalize">
                    {typeLabel}
                  </span>
                </div>
                {/* Name */}
                <h1 className="text-2xl md:text-3xl font-display text-foreground mb-2">
                  {spot.spot_name}
                </h1>
                {/* Location */}
                {spot.address && (
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-4 w-4 text-warm-400 shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      {spot.address}
                    </span>
                  </div>
                )}
                {/* Rating */}
                <div className="flex items-center gap-2 mb-4">
                  <StarRating rating={aggregatedRating} size="md" />
                  <span className="text-sm font-medium text-foreground">
                    {aggregatedRating.toFixed(1)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({PLACEHOLDER_REVIEWS.length} reviews)
                  </span>
                </div>
                {/* Attributes */}
                <div className="flex flex-wrap gap-2">
                  {PLACEHOLDER_ATTRIBUTES.map((attr) => (
                    <span
                      key={attr}
                      className="px-3 py-1 rounded-full bg-warm-50 text-warm-600 text-xs font-medium border border-warm-100"
                    >
                      {attr}
                    </span>
                  ))}
                  {/* TODO: fetch real attributes from backend */}
                </div>
              </div>
              {/* Actions column */}
              <div className="flex flex-col gap-2 shrink-0">
                <Button
                  variant="outline"
                  className="gap-2 rounded-xl"
                  onClick={() => {
                    // TODO: connect Google Maps deep-link with spot lat/lng
                    if (spot.latitude && spot.longitude) {
                      window.open(
                        `https://www.google.com/maps/search/?api=1&query=${spot.latitude},${spot.longitude}`,
                        "_blank",
                      );
                    }
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                  Open in Maps
                </Button>
                {isLoggedIn && (
                  <Button
                    variant="outline"
                    className="gap-2 rounded-xl"
                    onClick={() => {
                      // TODO: wire edit spot flow
                      console.log("Edit spot:", spot.spot_id);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit Spot
                  </Button>
                )}
                <Button
                  variant="ghost"
                  className="gap-2 rounded-xl text-muted-foreground hover:text-destructive"
                  onClick={() => setReportSpotOpen(true)}
                >
                  <Flag className="h-4 w-4" />
                  Report Spot
                </Button>
              </div>
            </div>

            {/* Description */}
            {spot.short_description && (
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {spot.short_description}
                </p>
              </div>
            )}
          </div>

          {/* ─── Map Section ─── */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-display text-foreground mb-4">
              Location
            </h2>
            <div className="rounded-xl overflow-hidden bg-warm-100 h-64 flex items-center justify-center">
              {spot.latitude && spot.longitude ? (
                <iframe
                  title="Spot location"
                  className="w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps/embed/v1/place?key=GOOGLE_MAPS_API_KEY&q=${spot.latitude},${spot.longitude}&zoom=15`}
                  // TODO: connect Google Maps embed using a real API key stored in secrets
                />
              ) : (
                <div className="text-center text-warm-400">
                  <MapPin className="h-10 w-10 mx-auto mb-2" />
                  <p className="text-sm font-medium">Map preview unavailable</p>
                  <p className="text-xs text-warm-300 mt-1">
                    No coordinates available for this spot
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ─── Hours ─── */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-warm-500" />
              <h2 className="text-lg font-display text-foreground">
                Hours of Operation
              </h2>
            </div>
            {/* TODO: populate hours from spot_hours API */}
            <div className="space-y-2">
              {DAYS_OF_WEEK.map((day) => (
                <div
                  key={day}
                  className="flex items-center justify-between py-2 px-3 rounded-lg even:bg-warm-50/50"
                >
                  <span className="text-sm font-medium text-foreground">
                    {day}
                  </span>
                  <span className="text-sm text-muted-foreground italic">
                    Hours coming soon
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ─── Spot Creator ─── */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-display text-foreground mb-4">
              Added By
            </h2>
            <div className="flex items-center gap-4">
              {/* TODO: replace placeholder creator avatar with real user profile image */}
              <div className="h-12 w-12 rounded-full bg-warm-200 flex items-center justify-center text-sm font-semibold text-warm-700 shrink-0">
                {getInitials(spot.creator_name)}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {spot.creator_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  Shared on{" "}
                  {new Date(spot.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* ─── Write a Review ─── */}
          {isLoggedIn && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-display text-foreground mb-4">
                Write a Review
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Your Rating
                  </label>
                  <StarRating
                    rating={reviewRating}
                    size="lg"
                    interactive
                    onRate={setReviewRating}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Your Review
                  </label>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Share your experience at this study spot..."
                    rows={4}
                    className="w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <Button
                  onClick={handleSubmitReview}
                  disabled={reviewRating === 0}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  Submit Review
                </Button>
              </div>
            </div>
          )}

          {/* ─── Reviews List ─── */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-display text-foreground mb-4">
              Reviews ({PLACEHOLDER_REVIEWS.length})
            </h2>
            {/* TODO: fetch reviews for this spot from reviews table */}
            <div className="space-y-4">
              {PLACEHOLDER_REVIEWS.map((review) => (
                <div
                  key={review.id}
                  className="rounded-xl border border-border p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {/* TODO: replace with real reviewer profile image */}
                      <div className="h-9 w-9 rounded-full bg-warm-200 flex items-center justify-center text-xs font-semibold text-warm-700 shrink-0">
                        {getInitials(review.name)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {review.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {review.date}
                        </p>
                      </div>
                    </div>
                    <StarRating rating={review.rating} size="sm" />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    {review.text}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        // TODO: wire edit review flow
                        console.log("Edit review:", review.id);
                      }}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-muted-foreground hover:text-destructive"
                      onClick={() => setReportReviewTarget(review.id)}
                    >
                      <Flag className="h-3 w-3 mr-1" />
                      Report
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Report modals */}
        <ReportModal
          open={reportSpotOpen}
          onOpenChange={setReportSpotOpen}
          type="spot"
          targetName={spot.spot_name}
        />
        <ReportModal
          open={reportReviewTarget !== null}
          onOpenChange={(open) => {
            if (!open) setReportReviewTarget(null);
          }}
          type="review"
        />
      </PageContainer>
    
  );
}
