import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/PageContainer";
import { PlaceholderShell } from "@/components/PlaceholderShell";
import { FloatingRightNav } from "@/components/FloatingRightNav";
import { Shield, Users, Flag } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

function AdminPage() {
  const { isLoggedIn, user } = useAuth();
  const canAccessAdmin = user?.roleId === 1 || user?.roleId === 2;

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-display text-foreground mb-2">Access Restricted</h2>
          <p className="text-sm text-muted-foreground mb-6">
            You need to be signed in to access the admin dashboard.
          </p>
          <Button asChild>
            <Link to="/signin">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!canAccessAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-display text-foreground mb-2">Access Restricted</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Your account does not have permission to access the admin dashboard.
          </p>
          <Button asChild>
            <Link to="/explore">Back to Explore</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <FloatingRightNav />
      <PageContainer>
        <PlaceholderShell
          title="Admin Dashboard"
          description="Manage users, moderate submissions, review flagged content, and maintain community standards."
          icon={<Shield className="h-7 w-7 text-warm-500" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-lg bg-warm-200 flex items-center justify-center">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <h4 className="font-semibold text-foreground">User Management</h4>
              </div>
              <p className="text-sm text-muted-foreground">View, edit, and manage user accounts, roles, and permissions across the platform.</p>
            </div>
            <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-lg bg-warm-200 flex items-center justify-center">
                  <Flag className="h-4 w-4 text-primary" />
                </div>
                <h4 className="font-semibold text-foreground">Content Moderation</h4>
              </div>
              <p className="text-sm text-muted-foreground">Review flagged spots and reviews, approve new submissions, and enforce community guidelines.</p>
            </div>
          </div>
        </PlaceholderShell>
      </PageContainer>
    </>
  );
}
