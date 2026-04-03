import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageContainer } from "@/components/PageContainer";
import { ProfileHeaderCard } from "@/components/ProfileHeaderCard";
import { SectionCard } from "@/components/SectionCard";
import { DangerZoneCard } from "@/components/DangerZoneCard";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { FileUpload } from "@/components/FileUpload";
import { PasswordInput } from "@/components/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FloatingRightNav } from "@/components/FloatingRightNav";
import { PageTitleBlock } from "@/components/PageTitleBlock";
import { useAuth } from "@/contexts/AuthContext";
import { updateProfile } from "@/server/update-profile";
import { updatePassword } from "@/server/update-password";
import { Shield } from "lucide-react";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const { isHydrated, isLoggedIn, user, updateUser } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    if (!isHydrated) return;

    setFullName(user?.displayName ?? "");
    setEmail(user?.email ?? "");
  }, [isHydrated, user]);

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  // Only authenticated (non-guest) users can view profile
  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-display text-foreground mb-2">
            Sign In Required
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            You need to be signed in to view your profile.
          </p>
          <Button asChild>
            <Link to="/signin">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    setProfileError("");
    setProfileSuccess("");

    try {
      setIsSavingProfile(true);

      const result = await updateProfile({
        data: {
          userId: user.userId,
          fullName,
          email,
        },
      });

      if (result?.success) {
        updateUser({
          displayName: result.user.displayName,
          email: result.user.email,
        });
        setProfileSuccess("Profile updated successfully.");
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong while updating your profile.";

      setProfileError(message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    setPasswordError("");
    setPasswordSuccess("");

    try {
      setIsSavingPassword(true);

      const result = await updatePassword({
        data: {
          userId: user.userId,
          currentPassword,
          newPassword,
          confirmNewPassword,
        },
      });

      if (result?.success) {
        setPasswordSuccess("Password updated successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong while updating your password.";

      setPasswordError(message);
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleDeleteAccount = () => {
    // Database implementation required here — delete user account and all associated data
    console.log("Account deletion confirmed");
  };

  return (
    <>
      <FloatingRightNav />
      <PageContainer>
        <PageTitleBlock
          title="Your Profile"
          subtitle="Manage your account details, profile photo, and security settings."
        />

        <div className="space-y-6">
          {/* Profile Header */}
          <ProfileHeaderCard
            name={user?.displayName ?? "Your Name"}
            email={user?.email ?? "you@example.com"}
            badge={user?.roleName ?? "Student"}
            onAvatarChange={() => {
              // Database implementation required here — upload new avatar
            }}
          />

          {/* Edit Profile */}
          <SectionCard
            title="Personal Information"
            description="Update your name and email address."
          >
            <form onSubmit={handleProfileSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Full Name
                  </label>
                  <Input
                    type="text"
                    placeholder="Your Name"
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
              </div>

              {profileError ? (
                <p className="text-sm font-medium text-destructive">
                  {profileError}
                </p>
              ) : null}

              {profileSuccess ? (
                <p className="text-sm font-medium text-green-600">
                  {profileSuccess}
                </p>
              ) : null}

              <div className="flex gap-3">
                <Button type="submit" disabled={isSavingProfile}>
                  {isSavingProfile ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFullName(user?.displayName ?? "");
                    setEmail(user?.email ?? "");
                    setProfileError("");
                    setProfileSuccess("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </SectionCard>

          {/* Profile Photo */}
          <SectionCard
            title="Profile Photo"
            description="Upload or change your profile picture."
          >
            <FileUpload
              onFileSelect={(file) => {
                // Database implementation required here — upload profile photo to storage
                console.log("Profile photo selected:", file);
              }}
            />
          </SectionCard>

          {/* Password */}
          <SectionCard
            title="Password"
            description="Update your password to keep your account secure."
          >
            <form onSubmit={handlePasswordSave} className="space-y-4 max-w-md">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Current Password
                </label>
                <PasswordInput
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  New Password
                </label>
                <PasswordInput
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Confirm New Password
                </label>
                <PasswordInput
                  placeholder="Confirm new password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                />
              </div>

              {passwordError ? (
                <p className="text-sm font-medium text-destructive">
                  {passwordError}
                </p>
              ) : null}

              {passwordSuccess ? (
                <p className="text-sm font-medium text-green-600">
                  {passwordSuccess}
                </p>
              ) : null}

              <Button type="submit" disabled={isSavingPassword}>
                {isSavingPassword ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </SectionCard>

          {/* Danger Zone */}
          <DangerZoneCard
            title="Delete Account"
            description="Permanently delete your account and all associated data. This action cannot be undone."
          >
            <Button
              variant="danger-outline"
              onClick={() => setDeleteModalOpen(true)}
            >
              Delete My Account
            </Button>
          </DangerZoneCard>
        </div>

        <ConfirmationModal
          open={deleteModalOpen}
          onOpenChange={setDeleteModalOpen}
          title="Delete your account?"
          description="This will permanently delete your account, including all saved spots, reviews, and preferences. This action is irreversible."
          confirmLabel="Yes, delete my account"
          cancelLabel="Keep my account"
          onConfirm={handleDeleteAccount}
          destructive
        />
      </PageContainer>
    </>
  );
}
