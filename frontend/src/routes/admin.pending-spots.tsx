import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FloatingRightNav } from "@/components/FloatingRightNav";
import { AdminSectionShell } from "@/components/admin/AdminSectionShell";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { SearchFilterBar } from "@/components/admin/SearchFilterBar";
import { BulkActionsBar } from "@/components/admin/BulkActionsBar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { sampleSpots } from "@/components/admin/sample-data";
import { Check, X, Eye, Pencil, MapPin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "@tanstack/react-router";
import { Shield } from "lucide-react";

export const Route = createFileRoute("/admin/pending-spots")({
  component: PendingSpotsPage,
});

// TODO: fetch pending spots from database (spots WHERE status = 'pending')
// TODO: connect approve/reject actions to spots.status update

function PendingSpotsPage() {
  const { isLoggedIn, user } = useAuth();
  const canAccessAdmin = user?.roleId === 1 || user?.roleId === 2;

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [editingSpot, setEditingSpot] = useState<(typeof sampleSpots)[0] | null>(null);
  const [editForm, setEditForm] = useState({ spot_name: "", spot_type: "", address: "", short_description: "" });

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

  const pendingSpots = sampleSpots.filter(
    (s) => s.status === "pending" && s.spot_name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: number) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const openEdit = (spot: (typeof sampleSpots)[0]) => {
    setEditingSpot(spot);
    setEditForm({ spot_name: spot.spot_name, spot_type: spot.spot_type, address: spot.address, short_description: spot.short_description });
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
                { label: "Approve All", onClick: () => { /* TODO: bulk approve */ }, variant: "default" },
                { label: "Reject All", onClick: () => { /* TODO: bulk reject */ }, variant: "destructive" },
              ]}
            />

            {pendingSpots.length === 0 ? (
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
                          <p className="font-medium text-foreground">{spot.spot_name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{spot.short_description}</p>
                        </td>
                        <td className="p-3 text-muted-foreground hidden md:table-cell">{spot.spot_type}</td>
                        <td className="p-3 text-muted-foreground text-xs hidden lg:table-cell">{spot.address}</td>
                        <td className="p-3 text-muted-foreground hidden md:table-cell">{spot.created_by}</td>
                        <td className="p-3 text-muted-foreground text-xs hidden lg:table-cell">{spot.created_at}</td>
                        <td className="p-3"><StatusBadge status={spot.status} /></td>
                        <td className="p-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg" title="View">
                              {/* TODO: navigate to spot detail */}
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg" title="Quick Edit" onClick={() => openEdit(spot)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" title="Approve">
                              {/* TODO: connect approve to spots.status = 'active' */}
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50" title="Reject">
                              {/* TODO: connect reject to spots.status = 'inactive' */}
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

      {/* Quick Edit Side Panel */}
      <Sheet open={!!editingSpot} onOpenChange={(open) => !open && setEditingSpot(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-display">Edit Before Approving</SheetTitle>
          </SheetHeader>
          {editingSpot && (
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Spot Name</label>
                <Input value={editForm.spot_name} onChange={(e) => setEditForm((f) => ({ ...f, spot_name: e.target.value }))} className="mt-1 rounded-xl" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Type</label>
                <Input value={editForm.spot_type} onChange={(e) => setEditForm((f) => ({ ...f, spot_type: e.target.value }))} className="mt-1 rounded-xl" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Address</label>
                <Input value={editForm.address} onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))} className="mt-1 rounded-xl" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Description</label>
                <Textarea value={editForm.short_description} onChange={(e) => setEditForm((f) => ({ ...f, short_description: e.target.value }))} className="mt-1 rounded-xl" rows={3} />
              </div>
              <div className="flex gap-2 pt-4">
                {/* TODO: save edits to database, then approve (set status = 'active') */}
                <Button className="flex-1 rounded-xl" onClick={() => setEditingSpot(null)}>
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
    </>
  );
}
