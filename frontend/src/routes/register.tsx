import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthCard } from "@/components/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/PasswordInput";
import { Checkbox } from "@/components/ui/checkbox";
import { FileUpload } from "@/components/FileUpload";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const { loginAsUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Database implementation required here — create user account and store profile data
    loginAsUser();
    navigate({ to: "/explore" });
  };

  return (
    <AuthCard
      title="Create your account"
      subtitle="Join MySpot and start discovering the best study spots."
      footer={
        <span>
          Already have an account?{" "}
          <Link to="/signin" className="text-primary font-medium hover:underline">
            Sign In
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Full Name</label>
          <Input type="text" placeholder="Jane Doe" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
          <Input type="email" placeholder="you@example.com" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Password</label>
          <PasswordInput placeholder="Create a password" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Confirm Password</label>
          <PasswordInput placeholder="Confirm your password" />
        </div>
        <FileUpload
          label="Profile Picture"
          onFileSelect={(file) => {
            // Database implementation required here — upload profile picture to storage
            console.log("File selected:", file);
          }}
        />
        <label className="flex items-start gap-2 text-sm text-muted-foreground cursor-pointer">
          <Checkbox className="mt-0.5" />
          <span>
            I agree to the{" "}
            <span className="text-primary hover:underline cursor-pointer">Terms of Service</span>
            {" "}and{" "}
            <span className="text-primary hover:underline cursor-pointer">Privacy Policy</span>
          </span>
        </label>
        <Button type="submit" className="w-full" size="lg">
          Create Account
        </Button>
      </form>
    </AuthCard>
  );
}
