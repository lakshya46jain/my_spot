import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { FloatingRightNav } from "@/components/FloatingRightNav";
import { AdminSectionShell } from "@/components/admin/AdminSectionShell";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { SearchFilterBar } from "@/components/admin/SearchFilterBar";
import { BulkActionsBar } from "@/components/admin/BulkActionsBar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { sampleReportedReviews } from "@/components/admin/sample-data";
import { Eye, Pencil, Trash2, CheckCircle2, XCircle, Star, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/admin/reported-reviews")({
  component: ReportedReviewsPage,
});

// TODO: fetch reported reviews from content_report JOIN reviews JOIN spots
// TODO: wire resolve/dismiss/remove actions to content_report and reviews tables

function ReportedReviewsPage() {
  const { isLoggedIn, user } = useAuth();
  const canAccessAdmin = user?.roleId === 1 || user?.roleId === 2;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [detailReview, setDetailReview] = useState<(typeof sampleReportedReviews)[0] | null>(null);

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

  const filtered = sampleReportedReviews.filter((r) => {
    const matchesSearch = r.reviewer.toLowerCase().includes(search.toLowerCase()) || r.spot_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || r.report_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleSelect = (id: number) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
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
                ],
                onChange: setStatusFilter,
              }]}
            />

            <BulkActionsBar
              selectedCount={selected.size}
              onClearSelection={() => setSelected(new Set())}
              actions={[
                { label: "Resolve All", onClick: () => { /* TODO: bulk resolve */ } },
                { label: "Remove All", onClick: () => { /* TODO: bulk remove reviews */ }, variant: "destructive" },
              ]}
            />

            <div className="space-y-3">
              {filtered.map((review) => (
                <div key={review.report_id} className="rounded-2xl bg-card border border-border p-5 shadow-sm">
                  <div className="flex items-start gap-4">
                    <Checkbox checked={selected.has(review.report_id)} onCheckedChange={() => toggleSelect(review.report_id)} className="mt-1" />
                    <div className="h-10 w-10 rounded-full bg-warm-200 flex items-center justify-center text-sm font-semibold text-warm-700 shrink-0">
                      {review.reviewer.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-foreground">{review.reviewer}</p>
                        <span className="text-xs text-muted-foreground">on</span>
                        <p className="font-medium text-primary text-sm">{review.spot_name}</p>
                        <StatusBadge status={review.report_status} />
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-3 w-3 ${i < review.rating ? "text-amber-400 fill-amber-400" : "text-warm-200"}`} />
                        ))}
                        <span className="text-xs text-muted-foreground ml-1">{review.review_date}</span>
                      </div>
                      <p className="text-sm text-foreground mt-2 line-clamp-2">{review.review_text}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {review.report_reasons.map((reason) => (
                          <span key={reason} className="inline-flex items-center rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-xs text-rose-700">{reason}</span>
                        ))}
                        <span className="text-xs text-muted-foreground">{review.report_count} report(s)</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg" title="View Details" onClick={() => setDetailReview(review)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg text-emerald-600 hover:bg-emerald-50" title="Resolve">
                        {/* TODO: mark report resolved in content_report */}
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg text-warm-500 hover:bg-warm-50" title="Dismiss">
                        {/* TODO: dismiss report */}
                        <XCircle className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg text-rose-600 hover:bg-rose-50" title="Remove Review">
                        {/* TODO: remove/hide review in reviews table */}
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </AdminSectionShell>
      </div>

      {/* Review Detail Panel */}
      <Sheet open={!!detailReview} onOpenChange={(open) => !open && setDetailReview(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-display">Review Report Details</SheetTitle>
          </SheetHeader>
          {detailReview && (
            <div className="mt-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-warm-200 flex items-center justify-center text-lg font-semibold text-warm-700">
                  {detailReview.reviewer.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="font-medium text-foreground">{detailReview.reviewer}</p>
                  <p className="text-sm text-muted-foreground">Review on {detailReview.spot_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < detailReview.rating ? "text-amber-400 fill-amber-400" : "text-warm-200"}`} />
                ))}
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Full Review</p>
                <p className="text-foreground bg-muted/30 rounded-xl p-4">{detailReview.review_text}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Report Reasons</p>
                <div className="flex flex-wrap gap-2">
                  {detailReview.report_reasons.map((reason) => (
                    <span key={reason} className="inline-flex items-center rounded-full bg-rose-50 border border-rose-200 px-2.5 py-1 text-xs text-rose-700">{reason}</span>
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
                  <p className="font-semibold text-foreground">{detailReview.review_date}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-4 border-t">
                {/* TODO: wire to database */}
                <Button className="flex-1 rounded-xl" onClick={() => setDetailReview(null)}>
                  <CheckCircle2 className="h-4 w-4 mr-1.5" /> Resolve
                </Button>
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setDetailReview(null)}>
                  Dismiss
                </Button>
                <Button variant="destructive" className="rounded-xl" onClick={() => setDetailReview(null)}>
                  <Trash2 className="h-4 w-4 mr-1.5" /> Remove
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
