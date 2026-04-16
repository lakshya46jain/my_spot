import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FloatingRightNav } from "@/components/FloatingRightNav";
import { AdminSectionShell } from "@/components/admin/AdminSectionShell";
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
import { Eye, Pencil, Ban, CheckCircle2, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserFriendlyErrorMessage } from "@/lib/error-message";
import { hasAdminAccess } from "@/lib/admin";
import {
  getGoogleMapsAddressSearchUrl,
  getGoogleMapsSearchUrl,
} from "@/lib/google-maps-urls";
import { getSpotTypeLabel, SPOT_TYPES } from "@/lib/spot-types";
import { getAdminSpots, updateAdminSpotStatuses } from "@/server/admin";
import { updateSpot } from "@/server/spots";
import type { AdminSpotRow } from "@/types/admin";

export const Route = createFileRoute("/admin/spots")({
  component: AllSpotsPage,
});

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function AllSpotsPage() {
  const { isLoggedIn, user } = useAuth();
  const canAccessAdmin = hasAdminAccess(user);

  const [spots, setSpots] = useState<AdminSpotRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [editingSpot, setEditingSpot] = useState<AdminSpotRow | null>(null);
  const [editForm, setEditForm] = useState({
    spot_name: "",
    spot_type: "",
    address: "",
    latitude: "",
    longitude: "",
    short_description: "",
  });

  async function loadSpots() {
    try {
      setLoading(true);
      setPageError("");
      setSpots(await getAdminSpots());
    } catch (error) {
      setPageError(
        getUserFriendlyErrorMessage(error, "Could not load spots."),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (canAccessAdmin) {
      loadSpots();
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

  const filtered = spots.filter((spot) => {
    const matchesSearch = spot.spot_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || spot.status === statusFilter;
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

  const openEdit = (spot: AdminSpotRow) => {
    setEditingSpot(spot);
    setEditForm({
      spot_name: spot.spot_name,
      spot_type: spot.spot_type,
      address: spot.address ?? "",
      latitude: spot.latitude === null ? "" : String(spot.latitude),
      longitude: spot.longitude === null ? "" : String(spot.longitude),
      short_description: spot.short_description ?? "",
    });
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
      setActionMessage("Selected spots were updated successfully.");
      setSelected(new Set());
      await loadSpots();
    } catch (error) {
      setPageError(
        getUserFriendlyErrorMessage(error, "Could not update the selected spots."),
      );
    }
  };

  const handleStatusChange = async (
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
        status === "active"
          ? "Spot marked active successfully."
          : "Spot marked inactive successfully.",
      );
      await loadSpots();
    } catch (error) {
      setPageError(
        getUserFriendlyErrorMessage(error, "Could not update the spot status."),
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
      await loadSpots();
    } catch (error) {
      setPageError(
        getUserFriendlyErrorMessage(error, "Could not save the spot changes."),
      );
    }
  };

  return (
    <>
      <FloatingRightNav />
      <div className="pr-20">
        <AdminSectionShell title="All Spots" subtitle="Central management for every spot on the platform.">
          <div className="space-y-4">
            <SearchFilterBar
              searchPlaceholder="Search spots..."
              searchValue={search}
              onSearchChange={setSearch}
              filters={[{
                label: "Status",
                value: statusFilter,
                options: [
                  { label: "All Statuses", value: "all" },
                  { label: "Active", value: "active" },
                  { label: "Inactive", value: "inactive" },
                  { label: "Pending", value: "pending" },
                ],
                onChange: setStatusFilter,
              }]}
            />

            <BulkActionsBar
              selectedCount={selected.size}
              onClearSelection={() => setSelected(new Set())}
              actions={[
                { label: "Set Active", onClick: () => handleBulkStatusUpdate("active") },
                { label: "Mark Inactive", onClick: () => handleBulkStatusUpdate("inactive"), variant: "destructive" },
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
                Loading spots...
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
                      <th className="p-3 text-left font-medium text-muted-foreground hidden md:table-cell">Created By</th>
                      <th className="p-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Date</th>
                      <th className="p-3 text-left font-medium text-muted-foreground">Status</th>
                      <th className="p-3 text-right font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((spot) => (
                      <tr key={spot.spot_id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="p-3"><Checkbox checked={selected.has(spot.spot_id)} onCheckedChange={() => toggleSelect(spot.spot_id)} /></td>
                        <td className="p-3">
                          <p className="font-medium text-foreground">{spot.spot_name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{spot.short_description}</p>
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
                        <td className="p-3 text-muted-foreground hidden md:table-cell">{spot.created_by}</td>
                        <td className="p-3 text-muted-foreground text-xs hidden lg:table-cell">{formatDate(spot.created_at)}</td>
                        <td className="p-3"><StatusBadge status={spot.status} /></td>
                        <td className="p-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg" title="View" asChild>
                              <Link
                                to="/spot/$spotId"
                                params={{ spotId: String(spot.spot_id) }}
                                search={{ from: "admin-spots", adminPreview: false }}
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg" title="Edit" onClick={() => openEdit(spot)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            {spot.status !== "active" ? (
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" title={spot.status === "pending" ? "Approve Spot" : "Mark Active"} onClick={() => handleStatusChange(spot.spot_id, "active")}>
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              </Button>
                            ) : null}
                            {spot.status !== "inactive" ? (
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg text-warm-500 hover:text-warm-700 hover:bg-warm-50" title="Mark Inactive" onClick={() => handleStatusChange(spot.spot_id, "inactive")}>
                                <Ban className="h-3.5 w-3.5" />
                              </Button>
                            ) : null}
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
            <SheetTitle className="font-display">Edit Spot</SheetTitle>
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
