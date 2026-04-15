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
import { sampleReportedSpots } from "@/components/admin/sample-data";
import { Eye, Pencil, Ban, CheckCircle2, XCircle, Flag, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/admin/reported-spots")({
  component: ReportedSpotsPage,
});

// TODO: fetch reported spots from content_report JOIN spots
// TODO: wire resolve/dismiss actions to content_report table
// TODO: wire spot status changes to spots table

function ReportedSpotsPage() {
  const { isLoggedIn, user } = useAuth();
  const canAccessAdmin = user?.roleId === 1 || user?.roleId === 2;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [detailReport, setDetailReport] = useState<(typeof sampleReportedSpots)[0] | null>(null);

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

  const filtered = sampleReportedSpots.filter((r) => {
    const matchesSearch = r.spot_name.toLowerCase().includes(search.toLowerCase());
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
        <AdminSectionShell title="Reported Spots" subtitle="Review and resolve spot-level reports from the community.">
          <div className="space-y-4">
            <SearchFilterBar
              searchPlaceholder="Search reported spots..."
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
                { label: "Resolve All", onClick: () => { /* TODO: bulk resolve reports */ } },
                { label: "Dismiss All", onClick: () => { /* TODO: bulk dismiss */ }, variant: "outline" },
              ]}
            />

            <div className="rounded-2xl border border-border overflow-hidden bg-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="p-3 w-10" />
                    <th className="p-3 text-left font-medium text-muted-foreground">Spot</th>
                    <th className="p-3 text-left font-medium text-muted-foreground hidden md:table-cell">Type</th>
                    <th className="p-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Reports</th>
                    <th className="p-3 text-left font-medium text-muted-foreground">Reason</th>
                    <th className="p-3 text-left font-medium text-muted-foreground hidden md:table-cell">Report Status</th>
                    <th className="p-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Spot Status</th>
                    <th className="p-3 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((report) => (
                    <tr key={report.report_id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="p-3"><Checkbox checked={selected.has(report.report_id)} onCheckedChange={() => toggleSelect(report.report_id)} /></td>
                      <td className="p-3">
                        <p className="font-medium text-foreground">{report.spot_name}</p>
                        <p className="text-xs text-muted-foreground">{report.address}</p>
                      </td>
                      <td className="p-3 text-muted-foreground hidden md:table-cell">{report.spot_type}</td>
                      <td className="p-3 hidden lg:table-cell">
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
                          <Flag className="h-3 w-3 text-rose-500" /> {report.report_count}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-foreground">{report.latest_reason}</td>
                      <td className="p-3 hidden md:table-cell"><StatusBadge status={report.report_status} /></td>
                      <td className="p-3 hidden lg:table-cell"><StatusBadge status={report.spot_status} /></td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg" title="View Details" onClick={() => setDetailReport(report)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg" title="Edit Spot">
                            {/* TODO: open spot edit */}
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg text-emerald-600 hover:bg-emerald-50" title="Mark Resolved">
                            {/* TODO: update content_report status */}
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg text-warm-500 hover:bg-warm-50" title="Dismiss">
                            {/* TODO: dismiss report */}
                            <XCircle className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg text-rose-600 hover:bg-rose-50" title="Mark Inactive">
                            {/* TODO: set spot status = 'inactive' */}
                            <Ban className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </AdminSectionShell>
      </div>

      {/* Report Detail Side Panel */}
      <Sheet open={!!detailReport} onOpenChange={(open) => !open && setDetailReport(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-display">Report Details</SheetTitle>
          </SheetHeader>
          {detailReport && (
            <div className="mt-6 space-y-5">
              <div>
                <p className="text-sm text-muted-foreground">Spot</p>
                <p className="font-medium text-foreground">{detailReport.spot_name}</p>
                <p className="text-xs text-muted-foreground">{detailReport.address}</p>
              </div>
              <div className="flex gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Report Status</p>
                  <StatusBadge status={detailReport.report_status} className="mt-1" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Spot Status</p>
                  <StatusBadge status={detailReport.spot_status} className="mt-1" />
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Report Count</p>
                <p className="text-lg font-semibold text-foreground">{detailReport.report_count}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Latest Reason</p>
                <p className="text-foreground">{detailReport.latest_reason}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reported On</p>
                <p className="text-foreground">{detailReport.report_date}</p>
              </div>
              <div className="flex gap-2 pt-4 border-t">
                {/* TODO: wire these to database actions */}
                <Button className="flex-1 rounded-xl" onClick={() => setDetailReport(null)}>
                  <CheckCircle2 className="h-4 w-4 mr-1.5" /> Resolve
                </Button>
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setDetailReport(null)}>
                  Dismiss
                </Button>
                <Button variant="destructive" className="rounded-xl" onClick={() => setDetailReport(null)}>
                  <Ban className="h-4 w-4 mr-1.5" /> Deactivate Spot
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
