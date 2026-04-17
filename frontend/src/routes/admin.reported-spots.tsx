import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FloatingRightNav } from "@/components/FloatingRightNav";
import { AdminSectionShell } from "@/components/admin/AdminSectionShell";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { GoogleAddressField } from "@/components/GoogleAddressField";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { SearchFilterBar } from "@/components/admin/SearchFilterBar";
import { BulkActionsBar } from "@/components/admin/BulkActionsBar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Eye, Pencil, Ban, CheckCircle2, XCircle, Flag, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserFriendlyErrorMessage } from "@/lib/error-message";
import { hasAdminAccess } from "@/lib/admin";
import {
  getGoogleMapsAddressSearchUrl,
  getGoogleMapsSearchUrl,
} from "@/lib/google-maps-urls";
import { getSpotTypeLabel, SPOT_TYPES } from "@/lib/spot-types";
import {
  getAdminReportedSpots,
  moderateAdminSpotReports,
  updateAdminSpotStatuses,
} from "@/server/admin";
import { deleteSpotMedia, getSpot, updateSpot } from "@/server/spots";
import type { AdminReportedSpotRow } from "@/types/admin";
import type { SpotMedia } from "@/types/api";

export const Route = createFileRoute("/admin/reported-spots")({
  component: ReportedSpotsPage,
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

function ReportedSpotsPage() {
  const { isLoggedIn, user } = useAuth();
  const canAccessAdmin = hasAdminAccess(user);

  const [reports, setReports] = useState<AdminReportedSpotRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [detailReport, setDetailReport] = useState<AdminReportedSpotRow | null>(null);
  const [editingSpot, setEditingSpot] = useState<AdminReportedSpotRow | null>(null);
  const [detailSpotMedia, setDetailSpotMedia] = useState<SpotMedia[]>([]);
  const [mediaDeleteTarget, setMediaDeleteTarget] = useState<SpotMedia | null>(null);
  const [deletingMedia, setDeletingMedia] = useState(false);
  const [editForm, setEditForm] = useState({
    spot_name: "",
    spot_type: "",
    address: "",
    latitude: "",
    longitude: "",
    short_description: "",
  });
  const [resolutionNote, setResolutionNote] = useState("");
  const [reportResolutionNotes, setReportResolutionNotes] = useState<
    Record<number, string>
  >({});

  async function loadReportedSpots() {
    try {
      setLoading(true);
      setPageError("");
      setReports(await getAdminReportedSpots());
    } catch (error) {
      setPageError(
        getUserFriendlyErrorMessage(error, "Could not load reported spots."),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (canAccessAdmin) {
      loadReportedSpots();
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

  const filtered = reports.filter((report) => {
    const matchesSearch = report.spot_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || report.report_status === statusFilter;
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

  const openEdit = (report: AdminReportedSpotRow) => {
    setEditingSpot(report);
    setEditForm({
      spot_name: report.spot_name,
      spot_type: report.spot_type,
      address: report.address ?? "",
      latitude: report.latitude === null ? "" : String(report.latitude),
      longitude: report.longitude === null ? "" : String(report.longitude),
      short_description: report.short_description ?? "",
    });
  };

  const handleModeration = async (
    action: "resolve" | "dismiss" | "deactivate",
    spotIds: number[],
  ) => {
    if (spotIds.length === 0) {
      return;
    }

    try {
      setPageError("");
      setActionMessage("");
      await moderateAdminSpotReports({
        data: {
          spotIds,
          action,
          resolutionNote,
        },
      });
      setActionMessage("Spot report queue updated successfully.");
      setSelected(new Set());
      setDetailReport(null);
      setResolutionNote("");
      setReportResolutionNotes({});
      await loadReportedSpots();
    } catch (error) {
      setPageError(
        getUserFriendlyErrorMessage(error, "Could not update the spot reports."),
      );
    }
  };

  const handleReportModeration = async (
    action: "resolve" | "dismiss",
    reportIds: number[],
  ) => {
    if (reportIds.length === 0 || !detailReport) {
      return;
    }

    try {
      setPageError("");
      setActionMessage("");
      await moderateAdminSpotReports({
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
      await loadReportedSpots();
    } catch (error) {
      setPageError(
        getUserFriendlyErrorMessage(error, "Could not update the selected report."),
      );
    }
  };

  const handleReactivateSpot = async (spotId: number) => {
    try {
      setPageError("");
      setActionMessage("");
      await updateAdminSpotStatuses({
        data: {
          spotIds: [spotId],
          status: "active",
        },
      });
      setActionMessage("Spot reactivated successfully.");
      await loadReportedSpots();
    } catch (error) {
      setPageError(
        getUserFriendlyErrorMessage(error, "Could not reactivate the spot."),
      );
    }
  };

  const handleSaveEdit = async () => {
    if (!editingSpot) {
      return;
    }

    try {
      setPageError("");
      setActionMessage("");
      await updateSpot({
        data: {
          spotId: editingSpot.spot_id,
          spot_name: editForm.spot_name,
          spot_type: editForm.spot_type,
          address: editForm.address,
          latitude: editForm.latitude,
          longitude: editForm.longitude,
          short_description: editForm.short_description,
        },
      });
      setActionMessage("Spot updated successfully.");
      setEditingSpot(null);
      await loadReportedSpots();
    } catch (error) {
      setPageError(
        getUserFriendlyErrorMessage(error, "Could not save the spot changes."),
      );
    }
  };

  const handleOpenDetailReport = async (report: AdminReportedSpotRow) => {
    setDetailReport(report);
    try {
      const result = await getSpot({ data: { spotId: report.spot_id } });
      setDetailSpotMedia(result.media ?? []);
    } catch {
      setDetailSpotMedia([]);
    }
  };

  const handleDeleteMedia = async () => {
    if (!detailReport || !mediaDeleteTarget?.media_id) {
      return;
    }

    try {
      setDeletingMedia(true);
      setPageError("");
      setActionMessage("");
      await deleteSpotMedia({
        data: {
          spotId: detailReport.spot_id,
          mediaId: mediaDeleteTarget.media_id,
        },
      });
      setDetailSpotMedia((current) =>
        current.filter((media) => media.media_id !== mediaDeleteTarget.media_id),
      );
      setActionMessage("Photo removed successfully.");
      await loadReportedSpots();
    } catch (error) {
      setPageError(
        getUserFriendlyErrorMessage(error, "Could not delete the selected photo."),
      );
    } finally {
      setDeletingMedia(false);
      setMediaDeleteTarget(null);
    }
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
                { label: "Dismiss All", onClick: () => handleModeration("dismiss", Array.from(selected)), variant: "outline" },
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
                Loading reported spots...
              </div>
            ) : (
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
                      <tr key={report.spot_id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="p-3"><Checkbox checked={selected.has(report.spot_id)} onCheckedChange={() => toggleSelect(report.spot_id)} /></td>
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-warm-100 overflow-hidden flex items-center justify-center shrink-0">
                              {report.primary_media_url ? (
                                <img src={report.primary_media_url} alt={report.spot_name} className="h-full w-full object-cover" />
                              ) : null}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground">{report.spot_name}</p>
                              {report.address ? (
                                <a
                                  href={
                                    report.latitude !== null && report.longitude !== null
                                      ? getGoogleMapsSearchUrl(report.latitude, report.longitude)
                                      : getGoogleMapsAddressSearchUrl(report.address)
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-primary hover:underline"
                                >
                                  {report.address}
                                </a>
                              ) : (
                                <p className="text-xs text-muted-foreground">No address</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground hidden md:table-cell">{getSpotTypeLabel(report.spot_type)}</td>
                        <td className="p-3 hidden lg:table-cell">
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
                            <Flag className="h-3 w-3 text-rose-500" /> {report.report_count}
                          </span>
                        </td>
                        <td className="p-3 text-sm text-foreground">
                          {report.open_report_count > 1
                            ? `${report.open_report_count} open reports`
                            : report.latest_reason}
                        </td>
                        <td className="p-3 hidden md:table-cell"><StatusBadge status={report.report_status} /></td>
                        <td className="p-3 hidden lg:table-cell"><StatusBadge status={report.spot_status} /></td>
                        <td className="p-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg" title="View Details" onClick={() => void handleOpenDetailReport(report)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </AdminSectionShell>
      </div>

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
                {detailReport.address ? (
                  <a
                    href={
                      detailReport.latitude !== null && detailReport.longitude !== null
                        ? getGoogleMapsSearchUrl(detailReport.latitude, detailReport.longitude)
                        : getGoogleMapsAddressSearchUrl(detailReport.address)
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    {detailReport.address}
                  </a>
                ) : (
                  <p className="text-xs text-muted-foreground">No address</p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Submitted By</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-warm-200 overflow-hidden flex items-center justify-center text-xs font-semibold text-warm-700">
                    {detailReport.submitted_by_avatar_url ? (
                      <img src={detailReport.submitted_by_avatar_url} alt={detailReport.submitted_by} className="h-full w-full object-cover" />
                    ) : (
                      getInitials(detailReport.submitted_by)
                    )}
                  </div>
                  <p className="text-sm font-medium text-foreground">{detailReport.submitted_by}</p>
                </div>
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
                <p className="text-sm text-muted-foreground mb-2">Photos</p>
                {detailSpotMedia.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {detailSpotMedia.map((media) => (
                      <div key={media.media_id ?? media.storage_path} className="overflow-hidden rounded-xl border border-border bg-muted/20">
                        <img src={media.media_url} alt={media.file_name} className="h-28 w-full object-cover" />
                        <div className="flex items-center justify-between gap-2 p-2">
                          <span className="truncate text-xs text-muted-foreground">
                            {media.is_primary ? "Primary photo" : media.file_name}
                          </span>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 rounded-lg px-2 text-xs"
                            onClick={() => setMediaDeleteTarget(media)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                    No photos uploaded for this spot.
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Reports On This Spot</p>
                <div className="space-y-3">
                  {detailReport.reports.map((reportEntry) => (
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
                            <Button size="sm" className="rounded-lg" onClick={() => handleReportModeration("resolve", [reportEntry.report_id])}>
                              Resolve Report
                            </Button>
                            <Button size="sm" variant="outline" className="rounded-lg" onClick={() => handleReportModeration("dismiss", [reportEntry.report_id])}>
                              Dismiss Report
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reported On</p>
                <p className="text-foreground">{formatDate(detailReport.report_date)}</p>
              </div>
              {detailReport.report_status === "open" ? (
                <>
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => openEdit(detailReport)}
                    >
                      <Pencil className="mr-1.5 h-4 w-4" />
                      Edit Spot
                    </Button>
                  </div>
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
                    <Button className="flex-1 rounded-xl" onClick={() => handleModeration("resolve", [detailReport.spot_id])}>
                      <CheckCircle2 className="h-4 w-4 mr-1.5" /> Resolve
                    </Button>
                    <Button variant="outline" className="flex-1 rounded-xl" onClick={() => handleModeration("dismiss", [detailReport.spot_id])}>
                      Dismiss
                    </Button>
                    {detailReport.spot_status === "inactive" ? (
                      <Button variant="outline" className="rounded-xl" onClick={() => handleReactivateSpot(detailReport.spot_id)}>
                        Reactivate Spot
                      </Button>
                    ) : null}
                    <Button variant="destructive" className="rounded-xl" onClick={() => handleModeration("deactivate", [detailReport.spot_id])}>
                      <Ban className="h-4 w-4 mr-1.5" /> Deactivate Spot
                    </Button>
                  </div>
                </>
              ) : null}
            </div>
          )}
        </SheetContent>
      </Sheet>
      <ConfirmationModal
        open={mediaDeleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deletingMedia) {
            setMediaDeleteTarget(null);
          }
        }}
        title="Remove Photo"
        description="This will hide this photo from the reported spot, but keep the record and Firebase file for future access."
        confirmLabel={deletingMedia ? "Removing..." : "Remove Photo"}
        onConfirm={() => {
          void handleDeleteMedia();
        }}
        destructive
      />

      <Sheet open={!!editingSpot} onOpenChange={(open) => !open && setEditingSpot(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-display">Edit Reported Spot</SheetTitle>
          </SheetHeader>
          {editingSpot && (
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Spot Name</label>
                <Input value={editForm.spot_name} onChange={(event) => setEditForm((form) => ({ ...form, spot_name: event.target.value }))} className="mt-1 rounded-xl" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Type</label>
                <Select value={editForm.spot_type} onValueChange={(value) => setEditForm((form) => ({ ...form, spot_type: value }))}>
                  <SelectTrigger className="mt-1 rounded-xl">
                    <SelectValue placeholder="Choose spot type" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPOT_TYPES.map((spotType) => (
                      <SelectItem key={spotType.value} value={spotType.value}>
                        {spotType.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Address</label>
                <div className="mt-1">
                  <GoogleAddressField
                    value={editForm.address}
                    onChange={(value) => setEditForm((form) => ({ ...form, address: value }))}
                    onLocationResolved={(location) =>
                      setEditForm((form) => ({
                        ...form,
                        address: location.address,
                        latitude: location.latitude,
                        longitude: location.longitude,
                      }))
                    }
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Description</label>
                <Textarea value={editForm.short_description} onChange={(event) => setEditForm((form) => ({ ...form, short_description: event.target.value }))} className="mt-1 rounded-xl" rows={3} />
              </div>
              <div className="flex gap-2 pt-4">
                <Button className="flex-1 rounded-xl" onClick={handleSaveEdit}>
                  Save Changes
                </Button>
                <Button variant="outline" className="rounded-xl" onClick={() => setEditingSpot(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
