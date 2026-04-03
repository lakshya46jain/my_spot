import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthCard } from "@/components/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/PasswordInput";
import { Checkbox } from "@/components/ui/checkbox";
import { FileUpload } from "@/components/FileUpload";
import { getUserFriendlyErrorMessage } from "@/lib/error-message";
import { registerUser } from "@/server/register-user";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();

  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [agreedToTerms, setAgreedToTerms] = React.useState(false);

  const [errorMessage, setErrorMessage] = React.useState("");
  const [successMessage, setSuccessMessage] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    try {
      setIsSubmitting(true);

      const result = await registerUser({
        data: {
          fullName,
          email,
          password,
          confirmPassword,
          agreedToTerms,
        },
      });

      if (result?.success) {
        setSuccessMessage(
          "Account created successfully. Redirecting to Sign In...",
        );
        setTimeout(() => {
          navigate({ to: "/signin" });
        }, 1000);
      }
    } catch (error) {
      setErrorMessage(
        getUserFriendlyErrorMessage(
          error,
          "Something went wrong while creating your account.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Create your account"
      subtitle="Join MySpot and start discovering the best study spots."
      footer={
        <span>
          Already have an account?{" "}
          <Link
            to="/signin"
            className="text-primary font-medium hover:underline"
          >
            Sign In
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Full Name
          </label>
          <Input
            type="text"
            placeholder="Jane Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Email
          </label>
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Password
          </label>
          <PasswordInput
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Confirm Password
          </label>
          <PasswordInput
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <FileUpload
          label="Profile Picture"
          onFileSelect={(file) => {
            // Profile picture storage is intentionally deferred for now.
            console.log("Selected profile picture:", file);
          }}
        />

        <label className="flex items-start gap-2 text-sm text-muted-foreground cursor-pointer">
          <Checkbox
            className="mt-0.5"
            checked={agreedToTerms}
            onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
          />
          <span>
            I agree to the{" "}
            <span className="text-primary hover:underline cursor-pointer">
              Terms of Service
            </span>{" "}
            and{" "}
            <span className="text-primary hover:underline cursor-pointer">
              Privacy Policy
            </span>
          </span>
        </label>

        {errorMessage ? (
          <p className="text-sm font-medium text-destructive">{errorMessage}</p>
        ) : null}

        {successMessage ? (
          <p className="text-sm font-medium text-green-600">{successMessage}</p>
        ) : null}

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating Account..." : "Create Account"}
        </Button>
      </form>
    </AuthCard>
  );
}
