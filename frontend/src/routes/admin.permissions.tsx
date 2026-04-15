import { createFileRoute, Link } from "@tanstack/react-router";
import { FloatingRightNav } from "@/components/FloatingRightNav";
import { AdminSectionShell } from "@/components/admin/AdminSectionShell";
import { Button } from "@/components/ui/button";
import { Lock, Shield, MapPin, MessageSquare, Users, BarChart3, Flag } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/admin/permissions")({
  component: PermissionsPage,
});

// TODO: permissions system coming in next phase

const permissionCategories = [
  { name: "Spot Management", icon: MapPin, permissions: ["Create spots", "Edit any spot", "Delete/deactivate spots", "Approve pending spots", "Change spot status"] },
  { name: "Review Management", icon: MessageSquare, permissions: ["Edit any review", "Remove reviews", "Respond to reviews"] },
  { name: "User Management", icon: Users, permissions: ["View all users", "Change user roles", "Deactivate accounts", "View deleted accounts"] },
  { name: "Report Management", icon: Flag, permissions: ["View reports", "Resolve reports", "Dismiss reports", "Bulk moderation actions"] },
  { name: "Analytics", icon: BarChart3, permissions: ["View dashboard metrics", "Export data", "View user analytics"] },
  { name: "Role Management", icon: Shield, permissions: ["Create roles", "Edit role names", "Assign permissions", "Delete roles"] },
];

function PermissionsPage() {
  const { isLoggedIn, user } = useAuth();
  const canAccessAdmin = user?.roleId === 1 || user?.roleId === 2;

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

  return (
    <>
      <FloatingRightNav />
      <div className="pr-20">
        <AdminSectionShell title="Role Permissions" subtitle="Configure granular permissions for each role.">
          <div className="space-y-6">
            {/* Coming Soon Banner */}
            <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Lock className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-display text-foreground">Detailed Permissions — Coming Next Phase</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                Granular role-permission management is planned for the next development phase.
                Below is the planned permission structure.
              </p>
            </div>

            {/* Permission Categories Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {permissionCategories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <div key={cat.name} className="rounded-2xl bg-card border border-border p-5 shadow-sm opacity-75">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-9 w-9 rounded-xl bg-warm-100 flex items-center justify-center">
                        <Icon className="h-4.5 w-4.5 text-primary" />
                      </div>
                      <h4 className="font-semibold text-foreground">{cat.name}</h4>
                    </div>
                    <ul className="space-y-1.5">
                      {cat.permissions.map((perm) => (
                        <li key={perm} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="h-4 w-4 rounded border border-border bg-muted/50" />
                          {perm}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </AdminSectionShell>
      </div>
    </>
  );
}
