import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { FloatingRightNav } from "@/components/FloatingRightNav";
import { AdminSectionShell } from "@/components/admin/AdminSectionShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { sampleRoles } from "@/components/admin/sample-data";
import { Plus, Users, Lock, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/admin/roles")({
  component: RolesPage,
});

// TODO: fetch roles from roles table
// TODO: connect role creation to roles table
// TODO: connect user count to aggregated query

function RolesPage() {
  const { isLoggedIn, user } = useAuth();
  const canAccessAdmin = user?.roleId === 1 || user?.roleId === 2;

  const [addOpen, setAddOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");

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
        <AdminSectionShell title="Roles" subtitle="Manage platform roles and permissions.">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{sampleRoles.length} roles configured</p>
              <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="rounded-xl">
                    <Plus className="h-4 w-4 mr-1.5" /> Add Role
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="font-display">Add New Role</DialogTitle>
                  </DialogHeader>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground">Role Name</label>
                      <Input
                        value={newRoleName}
                        onChange={(e) => setNewRoleName(e.target.value)}
                        placeholder="e.g., Content Reviewer"
                        className="mt-1 rounded-xl"
                      />
                    </div>
                    {/* TODO: insert role into roles table */}
                    <Button
                      className="w-full rounded-xl"
                      disabled={!newRoleName.trim()}
                      onClick={() => {
                        // TODO: connect to database — insert into roles table
                        setNewRoleName("");
                        setAddOpen(false);
                      }}
                    >
                      Create Role
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sampleRoles.map((role) => (
                <div key={role.role_id} className="rounded-2xl bg-card border border-border p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-foreground">{role.role_name}</h4>
                    <div className="h-8 w-8 rounded-lg bg-warm-100 flex items-center justify-center">
                      <Shield className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
                    <Users className="h-3.5 w-3.5" />
                    <span>{role.user_count.toLocaleString()} user(s)</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="rounded-lg flex-1" asChild>
                      <Link to="/admin/permissions">
                        <Lock className="h-3.5 w-3.5 mr-1" /> Permissions
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </AdminSectionShell>
      </div>
    </>
  );
}
