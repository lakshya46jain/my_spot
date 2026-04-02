import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthCard } from "@/components/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Database implementation required here — send password reset email
  };

  return (
    <AuthCard
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a link to reset it."
      footer={
        <Link to="/signin" className="text-primary font-medium hover:underline">
          Back to Sign In
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
          <Input type="email" placeholder="you@example.com" />
        </div>
        <Button type="submit" className="w-full" size="lg">
          Send Reset Link
        </Button>
      </form>
    </AuthCard>
  );
}
