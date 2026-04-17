import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FloatingRightNav } from "@/components/FloatingRightNav";
import { AdminSectionShell } from "@/components/admin/AdminSectionShell";
import { GoogleAddressField } from "@/components/GoogleAddressField";
import { ConfirmationModal } from "@/components/ConfirmationModal";
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
import { Check, X, Eye, Pencil, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserFriendlyErrorMessage } from "@/lib/error-message";
import { hasAdminAccess } from "@/lib/admin";
import {
  getGoogleMapsAddressSearchUrl,
  getGoogleMapsSearchUrl,
} from "@/lib/google-maps-urls";
import { getSpotTypeLabel, SPOT_TYPES } from "@/lib/spot-types";
import { getSpot, deleteSpotMedia, updateSpot } from "@/server/spots";
import { getAdminSpots, updateAdminSpotStatuses } from "@/server/admin";
import type { AdminSpotRow } from "@/types/admin";
import type { SpotMedia } from "@/types/api";

export const Route = createFileRoute("/admin/pending-spots")({
  component: PendingSpotsPage,
});

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
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

function PendingSpotsPage() {
  const { isLoggedIn, user } = useAuth();
  const canAccessAdmin = hasAdminAccess(user);

  const [spots, setSpots] = useState<AdminSpotRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [editingSpot, setEditingSpot] = useState<AdminSpotRow | null>(null);
  const [editingSpotMedia, setEditingSpotMedia] = useState<SpotMedia[]>([]);
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

  async function loadPendingSpots() {
    try {
      setLoading(true);
      setPageError("");
      const rows = await getAdminSpots();
      setSpots(rows);
    } catch (error) {
      setPageError(
        getUserFriendlyErrorMessage(error, "Could not load pending spots."),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (canAccessAdmin) {
      loadPendingSpots();
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

  const pendingSpots = spots.filter(
    (spot) =>
      spot.status === "pending" &&
      spot.spot_name.toLowerCase().includes(search.toLowerCase()),
  );

  const toggleSelect = (id: number) => {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelected(next);
  };

  const openEdit = async (spot: AdminSpotRow) => {
    setEditingSpot(spot);
    setEditForm({
      spot_name: spot.spot_name,
      spot_type: spot.spot_type,
      address: spot.address ?? "",
      latitude: spot.latitude === null ? "" : String(spot.latitude),
      longitude: spot.longitude === null ? "" : String(spot.longitude),
      short_description: spot.short_description ?? "",
    });
    try {
      const result = await getSpot({ data: { spotId: spot.spot_id } });
      setEditingSpotMedia(result.media ?? []);
    } catch {
      setEditingSpotMedia([]);
    }
  };

  const handleBulkStatusUpdate = async (status: "active" | "inactive") => {
    if (selected.size === 0) {
      return;
    }

    try {
      setPageError("");
      setActionMessage("");
      await updateAdminSpotStatuses({
        data: {
          spotIds: Array.from(selected),
          status,
        },
      });
      setActionMessage(
        status === "active"
          ? "Selected spots were approved."
          : "Selected spots were rejected.",
      );
      setSelected(new Set());
      await loadPendingSpots();
    } catch (error) {
      setPageError(
        getUserFriendlyErrorMessage(error, "Could not update the selected spots."),
      );
    }
  };

  const handleSingleStatusUpdate = async (
    spotId: number,
    status: "active" | "inactive",
  ) => {
    try {
      setPageError("");
      setActionMessage("");
      await updateAdminSpotStatuses({
        data: {
          spotIds: [spotId],
          status,
        },
      });
      setActionMessage(
        status === "active" ? "Spot approved successfully." : "Spot rejected successfully.",
      );
      await loadPendingSpots();
    } catch (error) {
      setPageError(
        getUserFriendlyErrorMessage(error, "Could not update the spot."),
      );
    }
  };

  const handleSaveAndApprove = async () => {
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
          status: "active",
        },
      });
      setActionMessage("Spot saved and approved successfully.");
      setEditingSpot(null);
      await loadPendingSpots();
    } catch (error) {
      setPageError(
        getUserFriendlyErrorMessage(error, "Could not save the spot changes."),
      );
    }
  };

  const handleDeleteMedia = async () => {
    if (!editingSpot || !mediaDeleteTarget?.media_id) {
      return;
    }

    try {
      setDeletingMedia(true);
      setPageError("");
      setActionMessage("");
      await deleteSpotMedia({
        data: {
          spotId: editingSpot.spot_id,
          mediaId: mediaDeleteTarget.media_id,
        },
      });
      setEditingSpotMedia((current) =>
        current.filter((media) => media.media_id !== mediaDeleteTarget.media_id),
      );
      setActionMessage("Photo removed successfully.");
      await loadPendingSpots();
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
        <AdminSectionShell title="Pending Spots" subtitle="Review and approve newly submitted study spots.">
          <div className="space-y-4">
            <SearchFilterBar searchPlaceholder="Search pending spots..." searchValue={search} onSearchChange={setSearch} />

            <BulkActionsBar
              selectedCount={selected.size}
              onClearSelection={() => setSelected(new Set())}
              actions={[
                { label: "Approve All", onClick: () => handleBulkStatusUpdate("active"), variant: "default" },
                { label: "Reject All", onClick: () => handleBulkStatusUpdate("inactive"), variant: "destructive" },
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
                Loading pending spots...
              </div>
            ) : pendingSpots.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-warm-300 bg-warm-50 p-10 text-center">
                <p className="text-muted-foreground">No pending spots to review.</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-border overflow-hidden bg-card">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="p-3 w-10" />
                      <th className="p-3 text-left font-medium text-muted-foreground">Spot</th>
                      <th className="p-3 text-left font-medium text-muted-foreground hidden md:table-cell">Type</th>
                      <th className="p-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Address</th>
                      <th className="p-3 text-left font-medium text-muted-foreground hidden md:table-cell">Submitted By</th>
                      <th className="p-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Date</th>
                      <th className="p-3 text-left font-medium text-muted-foreground">Status</th>
                      <th className="p-3 text-right font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingSpots.map((spot) => (
                      <tr key={spot.spot_id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="p-3">
                          <Checkbox checked={selected.has(spot.spot_id)} onCheckedChange={() => toggleSelect(spot.spot_id)} />
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-warm-100 overflow-hidden flex items-center justify-center shrink-0">
                              {spot.primary_media_url ? (
                                <img src={spot.primary_media_url} alt={spot.spot_name} className="h-full w-full object-cover" />
                              ) : null}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground">{spot.spot_name}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{spot.short_description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground hidden md:table-cell">{getSpotTypeLabel(spot.spot_type)}</td>
                        <td className="p-3 text-xs hidden lg:table-cell">
                          {spot.address ? (
                            <a
                              href={
                                spot.latitude !== null && spot.longitude !== null
                                  ? getGoogleMapsSearchUrl(spot.latitude, spot.longitude)
                                  : getGoogleMapsAddressSearchUrl(spot.address)
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:underline"
                            >
                              {spot.address}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">No address</span>
                          )}
                        </td>
                        <td className="p-3 hidden md:table-cell">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <div className="h-7 w-7 rounded-full bg-warm-200 overflow-hidden flex items-center justify-center text-[10px] font-semibold text-warm-700 shrink-0">
                              {spot.created_by_avatar_url ? (
                                <img src={spot.created_by_avatar_url} alt={spot.created_by} className="h-full w-full object-cover" />
                              ) : (
                                getInitials(spot.created_by)
                              )}
                            </div>
                            <span>{spot.created_by}</span>
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground text-xs hidden lg:table-cell">{formatDate(spot.created_at)}</td>
                        <td className="p-3"><StatusBadge status={spot.status} /></td>
                        <td className="p-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg" title="View" asChild>
                              <Link
                                to="/spot/$spotId"
                                params={{ spotId: String(spot.spot_id) }}
                                search={{ from: "pending-spots", adminPreview: true }}
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg" title="Quick Edit" onClick={() => openEdit(spot)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" title="Approve" onClick={() => handleSingleStatusUpdate(spot.spot_id, "active")}>
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50" title="Reject" onClick={() => handleSingleStatusUpdate(spot.spot_id, "inactive")}>
                              <X className="h-3.5 w-3.5" />
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

      <Sheet open={!!editingSpot} onOpenChange={(open) => !open && setEditingSpot(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-display">Edit Before Approving</SheetTitle>
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
              <div>
                <div className="mb-2">
                  <label className="text-sm font-medium text-foreground">Photos</label>
                  <p className="text-xs text-muted-foreground">
                    Remove individual photos before approving this spot.
                  </p>
                </div>
                {editingSpotMedia.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {editingSpotMedia.map((media) => (
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
              <div className="flex gap-2 pt-4">
                <Button className="flex-1 rounded-xl" onClick={handleSaveAndApprove}>
                  <Check className="h-4 w-4 mr-1.5" /> Save & Approve
                </Button>
                <Button variant="outline" className="rounded-xl" onClick={() => setEditingSpot(null)}>
                  Cancel
                </Button>
              </div>
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
        description="This will hide this photo from the pending spot, but keep the record and Firebase file for future access."
        confirmLabel={deletingMedia ? "Removing..." : "Remove Photo"}
        onConfirm={() => {
          void handleDeleteMedia();
        }}
        destructive
      />
    </>
  );
}
