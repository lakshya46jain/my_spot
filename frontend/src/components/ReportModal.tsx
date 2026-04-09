import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Flag, CheckCircle2 } from "lucide-react";
import { createReport } from "@/server/reports";
import { getUserFriendlyErrorMessage } from "@/lib/error-message";

const SPOT_REPORT_REASONS = [
  "Incorrect location",
  "Duplicate listing",
  "Closed / no longer valid",
  "Misleading information",
  "Inappropriate photos",
  "Unsafe or restricted place",
  "Spam / fake listing",
  "Other",
] as const;

const REVIEW_REPORT_REASONS = [
  "Spam",
  "Offensive or abusive language",
  "Harassment or hate speech",
  "Fake or misleading review",
  "Irrelevant content",
  "Personal information exposed",
  "Other",
] as const;

interface ReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "spot" | "review";
  targetName?: string;
  userId?: number | null;
  spotId?: number;
  reviewId?: number | null;
}

export function ReportModal({
  open,
  onOpenChange,
  type,
  targetName,
  userId,
  spotId,
  reviewId,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reasons = type === "spot" ? SPOT_REPORT_REASONS : REVIEW_REPORT_REASONS;

  const handleSubmit = async () => {
    if (!selectedReason) return;

    try {
      setSubmitting(true);
      setError("");

      if (!userId) {
        throw new Error("You must be signed in to submit a report.");
      }

      await createReport({
        data: {
          userId,
          type,
          spotId,
          reviewId: reviewId ?? undefined,
          reason: selectedReason,
          details,
        },
      });

      setSubmitted(true);
    } catch (err) {
      setError(
        getUserFriendlyErrorMessage(err, `Could not submit your ${type} report.`),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset after animation
    setTimeout(() => {
      setSelectedReason(null);
      setDetails("");
      setSubmitted(false);
      setError("");
      setSubmitting(false);
    }, 200);
  };

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="rounded-2xl max-w-md">
          <div className="flex flex-col items-center text-center py-6">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Report Submitted
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Thank you for helping keep MySpot safe. We'll review this {type} shortly.
            </p>
            <Button onClick={handleClose}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Flag className="h-5 w-5 text-destructive" />
            Report {type === "spot" ? "Spot" : "Review"}
          </DialogTitle>
          <DialogDescription>
            {targetName
              ? `Why are you reporting "${targetName}"?`
              : `Why are you reporting this ${type}?`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Reason selection */}
          <div className="space-y-2">
            {reasons.map((reason) => (
              <button
                key={reason}
                type="button"
                onClick={() => setSelectedReason(reason)}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm border transition-all ${
                  selectedReason === reason
                    ? "border-primary bg-primary/5 text-foreground font-medium"
                    : "border-border bg-card text-muted-foreground hover:border-warm-300 hover:bg-warm-50"
                }`}
              >
                {reason}
              </button>
            ))}
          </div>

          {/* Optional details */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Additional details{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Tell us more about the issue..."
              rows={3}
              className="w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              void handleSubmit();
            }}
            disabled={!selectedReason || submitting}
          >
            {submitting ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
