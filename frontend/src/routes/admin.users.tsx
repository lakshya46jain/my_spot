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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { sampleUsers, sampleRoles } from "@/components/admin/sample-data";
import { Eye, UserCog, MapPin, MessageSquare, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/admin/users")({
  component: UsersPage,
});

// TODO: fetch users from database with role info
// TODO: connect role assignment to user_roles or users.role_id update
// TODO: replicate delete-account backend logic here
// TODO: disable role change server-side for deleted users

function UsersPage() {
  const { isLoggedIn, user } = useAuth();
  const canAccessAdmin = user?.roleId === 1 || user?.roleId === 2;

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [detailUser, setDetailUser] = useState<(typeof sampleUsers)[0] | null>(null);

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

  const filtered = sampleUsers.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesStatus = statusFilter === "all" || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
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
        <AdminSectionShell title="Users" subtitle="Manage user accounts, roles, and permissions.">
          <div className="space-y-4">
            <SearchFilterBar
              searchPlaceholder="Search by name or email..."
              searchValue={search}
              onSearchChange={setSearch}
              filters={[
                {
                  label: "Role",
                  value: roleFilter,
                  options: [
                    { label: "All Roles", value: "all" },
                    ...sampleRoles.map((r) => ({ label: r.role_name, value: r.role_name })),
                  ],
                  onChange: setRoleFilter,
                },
                {
                  label: "Status",
                  value: statusFilter,
                  options: [
                    { label: "All", value: "all" },
                    { label: "Active", value: "active" },
                    { label: "Deleted", value: "deleted" },
                  ],
                  onChange: setStatusFilter,
                },
              ]}
            />

            <BulkActionsBar
              selectedCount={selected.size}
              onClearSelection={() => setSelected(new Set())}
              actions={[
                { label: "Assign Role", onClick: () => { /* TODO: bulk role assign */ } },
              ]}
            />

            <div className="rounded-2xl border border-border overflow-hidden bg-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="p-3 w-10" />
                    <th className="p-3 text-left font-medium text-muted-foreground">User</th>
                    <th className="p-3 text-left font-medium text-muted-foreground hidden md:table-cell">Email</th>
                    <th className="p-3 text-left font-medium text-muted-foreground">Role</th>
                    <th className="p-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Joined</th>
                    <th className="p-3 text-left font-medium text-muted-foreground hidden md:table-cell">Spots</th>
                    <th className="p-3 text-left font-medium text-muted-foreground hidden md:table-cell">Reviews</th>
                    <th className="p-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="p-3 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => {
                    const isDeleted = u.status === "deleted";
                    return (
                      <tr key={u.user_id} className={`border-b last:border-0 hover:bg-muted/20 transition-colors ${isDeleted ? "opacity-60" : ""}`}>
                        <td className="p-3"><Checkbox checked={selected.has(u.user_id)} onCheckedChange={() => toggleSelect(u.user_id)} /></td>
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-warm-200 flex items-center justify-center text-xs font-semibold text-warm-700">
                              {u.name.split(" ").map((n) => n[0]).join("")}
                            </div>
                            <p className="font-medium text-foreground">{u.name}</p>
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground hidden md:table-cell">{u.email}</td>
                        <td className="p-3">
                          {isDeleted ? (
                            <span className="text-xs text-muted-foreground">{u.role}</span>
                          ) : (
                            <Select defaultValue={u.role} onValueChange={() => { /* TODO: update role in database */ }}>
                              <SelectTrigger className="h-7 w-[120px] rounded-lg text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {sampleRoles.map((r) => (
                                  <SelectItem key={r.role_id} value={r.role_name}>{r.role_name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </td>
                        <td className="p-3 text-muted-foreground text-xs hidden lg:table-cell">{u.joined}</td>
                        <td className="p-3 hidden md:table-cell">
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" /> {u.spots_count}
                          </span>
                        </td>
                        <td className="p-3 hidden md:table-cell">
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <MessageSquare className="h-3 w-3" /> {u.reviews_count}
                          </span>
                        </td>
                        <td className="p-3"><StatusBadge status={u.status} /></td>
                        <td className="p-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg" title="View Profile" onClick={() => setDetailUser(u)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </AdminSectionShell>
      </div>

      {/* User Detail Panel */}
      <Sheet open={!!detailUser} onOpenChange={(open) => !open && setDetailUser(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-display">User Profile</SheetTitle>
          </SheetHeader>
          {detailUser && (
            <div className="mt-6 space-y-5">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-warm-200 flex items-center justify-center text-2xl font-semibold text-warm-700">
                  {detailUser.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="text-lg font-medium text-foreground">{detailUser.name}</p>
                  <p className="text-sm text-muted-foreground">{detailUser.email}</p>
                  <StatusBadge status={detailUser.status} className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Role</p>
                  <p className="font-medium text-foreground">{detailUser.role}</p>
                </div>
                <div className="rounded-xl bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Joined</p>
                  <p className="font-medium text-foreground">{detailUser.joined}</p>
                </div>
                <div className="rounded-xl bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Spots Submitted</p>
                  <p className="font-medium text-foreground">{detailUser.spots_count}</p>
                </div>
                <div className="rounded-xl bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Reviews Written</p>
                  <p className="font-medium text-foreground">{detailUser.reviews_count}</p>
                </div>
              </div>
              {detailUser.status === "deleted" && (
                <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-4">
                  <p className="text-sm text-destructive font-medium">This account has been deleted.</p>
                  <p className="text-xs text-muted-foreground mt-1">Role changes are disabled for deleted accounts.</p>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
