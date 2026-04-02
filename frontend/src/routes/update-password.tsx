import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthCard } from "@/components/AuthCard";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/PasswordInput";

export const Route = createFileRoute("/update-password")({
  component: UpdatePasswordPage,
});

function UpdatePasswordPage() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Database implementation required here — update user password
  };

  return (
    <AuthCard
      title="Update your password"
      subtitle="Choose a new secure password for your account."
      footer={
        <Link to="/profile" className="text-primary font-medium hover:underline">
          Back to Profile
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Current Password</label>
          <PasswordInput placeholder="Enter current password" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">New Password</label>
          <PasswordInput placeholder="Enter new password" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Confirm New Password</label>
          <PasswordInput placeholder="Confirm new password" />
        </div>
        <div className="flex gap-3">
          <Button type="submit" className="flex-1" size="lg">
            Update Password
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link to="/profile">Cancel</Link>
          </Button>
        </div>
      </form>
    </AuthCard>
  );
}
