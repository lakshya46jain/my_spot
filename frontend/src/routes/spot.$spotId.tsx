import { createFileRoute, Link } from "@tanstack/react-router";
import { PageContainer } from "@/components/PageContainer";
import { StarRating } from "@/components/StarRating";
import { ReportModal } from "@/components/ReportModal";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getGoogleMapsEmbedUrl, getGoogleMapsSearchUrl } from "@/lib/google-maps-urls";
import { getSpot } from "@/server/spots";
import { createReview, getSpotReviews } from "@/server/reviews";
import { getUserFriendlyErrorMessage } from "@/lib/error-message";
import type { Spot, SpotReview } from "@/types/api";
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

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatReviewDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Main Component ──────────────────────────────────────────────
function SpotDetailsPage() {
  const { spotId: spotIdStr } = Route.useParams();
  const { isLoggedIn, user } = useAuth();
  const spotId = Number(spotIdStr);

  const [spot, setSpot] = useState<Spot | null>(null);
  const [reviews, setReviews] = useState<SpotReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

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
        setReviewsLoading(true);
        setReviewsError("");
        const spotResult = await getSpot({ data: { spotId } });
        setSpot(spotResult);
      } catch (err) {
        setError(
          getUserFriendlyErrorMessage(err, "Could not load spot details."),
        );
      } finally {
        setLoading(false);
      }

      try {
        const reviewResults = await getSpotReviews({ data: { spotId } });
        setReviews(reviewResults);
      } catch (err) {
        setReviewsError(
          getUserFriendlyErrorMessage(err, "Could not load reviews."),
        );
      } finally {
        setReviewsLoading(false);
      }
    }

    if (spotId) {
      load();
    }
  }, [spotId]);

  const reviewCount = reviews.length;
  const aggregatedRating =
    reviewCount === 0
      ? 0
      : reviews.reduce((sum, review) => sum + Number(review.rating), 0) /
        reviewCount;

  const handleSubmitReview = async () => {
    if (!user || reviewRating === 0) return;

    try {
      setSubmittingReview(true);
      setSubmitError("");
      setSubmitSuccess("");

      const result = await createReview({
        data: {
          spotId,
          userId: user.userId,
          rating: reviewRating,
          review: reviewText,
        },
      });

      setReviews((prev) => [result.review, ...prev]);
      setReviewRating(0);
      setReviewText("");
      setSubmitSuccess(result.message);
    } catch (err) {
      setSubmitError(
        getUserFriendlyErrorMessage(err, "Could not submit your review."),
      );
    } finally {
      setSubmittingReview(false);
    }
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
  const hasCoordinates = spot.latitude !== null && spot.longitude !== null;
  const hasMapsEmbed =
    hasCoordinates && Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY);

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
                  {reviewCount > 0 ? (
                    <>
                      <span className="text-sm font-medium text-foreground">
                        {aggregatedRating.toFixed(1)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({reviewCount} review{reviewCount === 1 ? "" : "s"})
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      No reviews yet
                    </span>
                  )}
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
                    if (hasCoordinates) {
                      window.open(
                        getGoogleMapsSearchUrl(spot.latitude, spot.longitude),
                        "_blank",
                      );
                    }
                  }}
                  disabled={!hasCoordinates}
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
              {hasMapsEmbed ? (
                <iframe
                  title="Spot location"
                  className="w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={getGoogleMapsEmbedUrl(
                    import.meta.env.VITE_GOOGLE_MAPS_API_KEY!,
                    spot.latitude,
                    spot.longitude,
                  )}
                />
              ) : (
                <div className="text-center text-warm-400">
                  <MapPin className="h-10 w-10 mx-auto mb-2" />
                  <p className="text-sm font-medium">Map preview unavailable</p>
                  <p className="text-xs text-warm-300 mt-1">
                    {hasCoordinates
                      ? "Add VITE_GOOGLE_MAPS_API_KEY to enable the embedded map."
                      : "No coordinates available for this spot"}
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
                  disabled={reviewRating === 0 || submittingReview}
                  className="gap-2"
                >
                  {submittingReview ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </Button>
                {submitSuccess ? (
                  <p className="text-sm text-emerald-600">{submitSuccess}</p>
                ) : null}
                {submitError ? (
                  <p className="text-sm text-destructive">{submitError}</p>
                ) : null}
              </div>
            </div>
          )}

          {/* ─── Reviews List ─── */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-display text-foreground mb-4">
              Reviews ({reviewCount})
            </h2>
            {reviewsError ? (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                {reviewsError}
              </div>
            ) : reviewsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading reviews...
              </div>
            ) : reviewCount === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                No reviews have been shared for this spot yet.
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => {
                  const isOwnReview = user?.userId === review.user_id;

                  return (
                    <div
                      key={review.review_id}
                      className="rounded-xl border border-border p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          {/* TODO: replace with real reviewer profile image */}
                          <div className="h-9 w-9 rounded-full bg-warm-200 flex items-center justify-center text-xs font-semibold text-warm-700 shrink-0">
                            {getInitials(review.reviewer_name)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {review.reviewer_name}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {formatReviewDate(review.created_at)}
                            </p>
                          </div>
                        </div>
                        <StarRating rating={review.rating} size="sm" />
                      </div>
                      {review.review ? (
                        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                          {review.review}
                        </p>
                      ) : (
                        <p className="text-sm italic text-muted-foreground mb-3">
                          Rated without a written review.
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        {isOwnReview ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              // TODO: wire edit review flow
                              console.log("Edit review:", review.review_id);
                            }}
                          >
                            <Pencil className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-muted-foreground hover:text-destructive"
                          onClick={() => setReportReviewTarget(review.review_id)}
                        >
                          <Flag className="h-3 w-3 mr-1" />
                          Report
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
