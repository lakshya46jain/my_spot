import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FloatingRightNav } from "@/components/FloatingRightNav";
import { AdminSectionShell } from "@/components/admin/AdminSectionShell";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { SearchFilterBar } from "@/components/admin/SearchFilterBar";
import { BulkActionsBar } from "@/components/admin/BulkActionsBar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Eye, Trash2, CheckCircle2, XCircle, Star, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserFriendlyErrorMessage } from "@/lib/error-message";
import { hasAdminAccess } from "@/lib/admin";
import {
  getAdminReportedReviews,
  moderateAdminReviewReports,
} from "@/server/admin";
import type { AdminReportedReviewRow } from "@/types/admin";

export const Route = createFileRoute("/admin/reported-reviews")({
  component: ReportedReviewsPage,
});

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function ReportedReviewsPage() {
  const { isLoggedIn, user } = useAuth();
  const canAccessAdmin = hasAdminAccess(user);

  const [reviews, setReviews] = useState<AdminReportedReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [detailReview, setDetailReview] = useState<AdminReportedReviewRow | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [reportResolutionNotes, setReportResolutionNotes] = useState<
    Record<number, string>
  >({});

  async function loadReportedReviews() {
    try {
      setLoading(true);
      setPageError("");
      setReviews(await getAdminReportedReviews());
    } catch (error) {
      setPageError(
        getUserFriendlyErrorMessage(error, "Could not load reported reviews."),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (canAccessAdmin) {
      loadReportedReviews();
    }
  }, [canAccessAdmin]);

  if (!isLoggedIn || !canAccessAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-display text-foreground mb-2">Access Restricted</h2>
          <Button asChild><Link to="/admin">Back to Admin</Link></Button>
        </div>
      </div>
    );
  }

  const filtered = reviews.filter((review) => {
    const query = search.toLowerCase();
    const matchesSearch =
      review.reviewer.toLowerCase().includes(query) ||
      review.spot_name.toLowerCase().includes(query);
    const matchesStatus =
      statusFilter === "all" || review.report_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleSelect = (id: number) => {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelected(next);
  };

  const handleModeration = async (
    action: "resolve" | "dismiss" | "remove",
    reviewIds: number[],
  ) => {
    if (reviewIds.length === 0) {
      return;
    }

    try {
      setPageError("");
      setActionMessage("");
      await moderateAdminReviewReports({
        data: {
          reviewIds,
          action,
          resolutionNote,
        },
      });
      setActionMessage("Review moderation completed successfully.");
      setSelected(new Set());
      setDetailReview(null);
      setResolutionNote("");
      setReportResolutionNotes({});
      await loadReportedReviews();
    } catch (error) {
      setPageError(
        getUserFriendlyErrorMessage(error, "Could not complete review moderation."),
      );
    }
  };

  const handleIndividualReportModeration = async (
    action: "resolve" | "dismiss",
    reportIds: number[],
  ) => {
    if (reportIds.length === 0) {
      return;
    }

    try {
      setPageError("");
      setActionMessage("");
      await moderateAdminReviewReports({
        data: {
          reportIds,
          action,
          resolutionNote: reportResolutionNotes[reportIds[0]] ?? "",
        },
      });
      setActionMessage("Report updated successfully.");
      setReportResolutionNotes((current) => {
        const next = { ...current };

        for (const reportId of reportIds) {
          delete next[reportId];
        }

        return next;
      });
      await loadReportedReviews();
    } catch (error) {
      setPageError(
        getUserFriendlyErrorMessage(error, "Could not update the selected report."),
      );
    }
  };

  return (
    <>
      <FloatingRightNav />
      <div className="pr-20">
        <AdminSectionShell title="Reported Reviews" subtitle="Moderate flagged reviews and maintain community standards.">
          <div className="space-y-4">
            <SearchFilterBar
              searchPlaceholder="Search by reviewer or spot..."
              searchValue={search}
              onSearchChange={setSearch}
              filters={[{
                label: "Report Status",
                value: statusFilter,
                options: [
                  { label: "All", value: "all" },
                  { label: "Open", value: "open" },
                  { label: "Resolved", value: "resolved" },
                  { label: "Dismissed", value: "dismissed" },
                ],
                onChange: setStatusFilter,
              }]}
            />

            <BulkActionsBar
              selectedCount={selected.size}
              onClearSelection={() => setSelected(new Set())}
              actions={[
                { label: "Resolve All", onClick: () => handleModeration("resolve", Array.from(selected)) },
                { label: "Remove All", onClick: () => handleModeration("remove", Array.from(selected)), variant: "destructive" },
              ]}
            />

            {actionMessage ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {actionMessage}
              </div>
            ) : null}

            {pageError ? (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {pageError}
              </div>
            ) : null}

            {loading ? (
              <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
                Loading reported reviews...
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((review) => (
                  <div key={review.review_id} className="rounded-2xl bg-card border border-border p-5 shadow-sm">
                    <div className="flex items-start gap-4">
                      <Checkbox checked={selected.has(review.review_id)} onCheckedChange={() => toggleSelect(review.review_id)} className="mt-1" />
                      <div className="h-10 w-10 rounded-full bg-warm-200 flex items-center justify-center text-sm font-semibold text-warm-700 shrink-0 overflow-hidden">
                        {review.reviewer_avatar_url ? (
                          <img src={review.reviewer_avatar_url} alt={review.reviewer} className="h-full w-full object-cover" />
                        ) : (
                          getInitials(review.reviewer)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-foreground">{review.reviewer}</p>
                          <span className="text-xs text-muted-foreground">on</span>
                          <p className="font-medium text-primary text-sm">{review.spot_name}</p>
                          <StatusBadge status={review.report_status} />
                          {review.review_deleted ? <StatusBadge status="deleted" /> : null}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <Star key={index} className={`h-3 w-3 ${index < review.rating ? "text-amber-400 fill-amber-400" : "text-warm-200"}`} />
                          ))}
                          <span className="text-xs text-muted-foreground ml-1">{formatDate(review.review_date)}</span>
                        </div>
                        <p className="text-sm text-foreground mt-2 line-clamp-2">{review.review_text || "No review text provided."}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {review.report_reasons.map((reason) => (
                            <span key={reason} className="inline-flex items-center rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-xs text-rose-700">{reason}</span>
                          ))}
                          <span className="text-xs text-muted-foreground">
                            {review.open_report_count > 0
                              ? `${review.open_report_count} open / ${review.report_count} total`
                              : `${review.report_count} report(s)`}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg" title="View Details" onClick={() => setDetailReview(review)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </AdminSectionShell>
      </div>

      <Sheet open={!!detailReview} onOpenChange={(open) => !open && setDetailReview(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-display">Review Report Details</SheetTitle>
          </SheetHeader>
          {detailReview && (
            <div className="mt-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-warm-200 flex items-center justify-center text-lg font-semibold text-warm-700 overflow-hidden">
                  {detailReview.reviewer_avatar_url ? (
                    <img src={detailReview.reviewer_avatar_url} alt={detailReview.reviewer} className="h-full w-full object-cover" />
                  ) : (
                    getInitials(detailReview.reviewer)
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground">{detailReview.reviewer}</p>
                  <p className="text-sm text-muted-foreground">Review on {detailReview.spot_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} className={`h-4 w-4 ${index < detailReview.rating ? "text-amber-400 fill-amber-400" : "text-warm-200"}`} />
                ))}
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Full Review</p>
                <p className="text-foreground bg-muted/30 rounded-xl p-4">{detailReview.review_text || "No review text provided."}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Report Reasons</p>
                <div className="flex flex-wrap gap-2">
                  {detailReview.report_reasons.map((reason) => (
                    <span key={reason} className="inline-flex items-center rounded-full bg-rose-50 border border-rose-200 px-2.5 py-1 text-xs text-rose-700">{reason}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Reports On This Review</p>
                <div className="space-y-3">
                  {detailReview.reports.map((reportEntry) => (
                    <div key={reportEntry.report_id} className="rounded-xl border border-border bg-muted/20 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-foreground">{reportEntry.reason}</p>
                          <p className="text-xs text-muted-foreground">
                            Reported by {reportEntry.reporter_name} on {formatDateTime(reportEntry.created_at)}
                          </p>
                        </div>
                        <StatusBadge status={reportEntry.status} />
                      </div>
                      {reportEntry.details ? (
                        <p className="mt-2 text-sm text-foreground">{reportEntry.details}</p>
                      ) : null}
                      {reportEntry.resolution_note ? (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Resolution note: {reportEntry.resolution_note}
                        </p>
                      ) : null}
                      {reportEntry.status === "open" ? (
                        <div className="mt-3 space-y-3">
                          <div>
                            <label className="text-xs text-muted-foreground">
                              Resolution Note
                            </label>
                            <Textarea
                              value={reportResolutionNotes[reportEntry.report_id] ?? ""}
                              onChange={(event) =>
                                setReportResolutionNotes((current) => ({
                                  ...current,
                                  [reportEntry.report_id]: event.target.value,
                                }))
                              }
                              className="mt-1 rounded-xl"
                              rows={2}
                              placeholder="Add context for this individual report."
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" className="rounded-lg" onClick={() => handleIndividualReportModeration("resolve", [reportEntry.report_id])}>
                              Resolve Report
                            </Button>
                            <Button size="sm" variant="outline" className="rounded-lg" onClick={() => handleIndividualReportModeration("dismiss", [reportEntry.report_id])}>
                              Dismiss Report
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Report Count</p>
                  <p className="font-semibold text-foreground">{detailReview.report_count}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Review Date</p>
                  <p className="font-semibold text-foreground">{formatDate(detailReview.review_date)}</p>
                </div>
              </div>
              {detailReview.review_deleted ? (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
                  This review is hidden from users and remains stored for moderation history.
                </div>
              ) : null}
              {detailReview.report_status === "open" ? (
                <>
                  <div>
                    <label className="text-sm text-muted-foreground">Resolution Note</label>
                    <Textarea
                      value={resolutionNote}
                      onChange={(event) => setResolutionNote(event.target.value)}
                      className="mt-1 rounded-xl"
                      rows={3}
                      placeholder="Add context for the moderation decision."
                    />
                  </div>
                  <div className="flex gap-2 pt-4 border-t">
                    <Button className="flex-1 rounded-xl" onClick={() => handleModeration("resolve", [detailReview.review_id])}>
                      <CheckCircle2 className="h-4 w-4 mr-1.5" /> Resolve
                    </Button>
                    <Button variant="outline" className="flex-1 rounded-xl" onClick={() => handleModeration("dismiss", [detailReview.review_id])}>
                      Dismiss
                    </Button>
                    <Button variant="destructive" className="rounded-xl" onClick={() => handleModeration("remove", [detailReview.review_id])}>
                      <Trash2 className="h-4 w-4 mr-1.5" /> Remove
                    </Button>
                  </div>
                </>
              ) : null}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
