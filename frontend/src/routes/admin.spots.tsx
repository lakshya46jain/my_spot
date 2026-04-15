import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { FloatingRightNav } from "@/components/FloatingRightNav";
import { AdminSectionShell } from "@/components/admin/AdminSectionShell";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { SearchFilterBar } from "@/components/admin/SearchFilterBar";
import { BulkActionsBar } from "@/components/admin/BulkActionsBar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { sampleSpots } from "@/components/admin/sample-data";
import { Eye, Pencil, Ban, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/admin/spots")({
  component: AllSpotsPage,
});

// TODO: fetch all spots from database
// TODO: wire status changes (active/inactive/pending) to spots table

function AllSpotsPage() {
  const { isLoggedIn, user } = useAuth();
  const canAccessAdmin = user?.roleId === 1 || user?.roleId === 2;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Set<number>>(new Set());

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

  const filtered = sampleSpots.filter((s) => {
    const matchesSearch = s.spot_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
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
                { label: "Set Active", onClick: () => { /* TODO: bulk update status */ } },
                { label: "Mark Inactive", onClick: () => { /* TODO: bulk deactivate */ }, variant: "destructive" },
              ]}
            />

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
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg" title="Edit">
                            {/* TODO: open edit panel */}
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg text-warm-500 hover:text-warm-700 hover:bg-warm-50" title="Mark Inactive">
                            {/* TODO: set status = 'inactive' */}
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
    </>
  );
}
