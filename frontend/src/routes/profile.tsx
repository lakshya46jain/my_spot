import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
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
import { Shield } from "lucide-react";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const { isLoggedIn } = useAuth();

  // Only authenticated (non-guest) users can view profile
  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-display text-foreground mb-2">Sign In Required</h2>
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

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Database implementation required here — update user profile data
  };

  const handlePasswordSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Database implementation required here — update user password
  };

  const handleDeleteAccount = () => {
    // Database implementation required here — delete user account and all associated data
    console.log("Account deletion confirmed");
  };

  return (
    <>
      <FloatingRightNav />
      <PageContainer>
        <PageTitleBlock title="Your Profile" subtitle="Manage your account details, profile photo, and security settings." />

        <div className="space-y-6">
          {/* Profile Header */}
          <ProfileHeaderCard
            name="Your Name"
            email="you@example.com"
            badge="Student"
            onAvatarChange={() => {
              // Database implementation required here — upload new avatar
            }}
          />

          {/* Edit Profile */}
          <SectionCard title="Personal Information" description="Update your name and email address.">
            <form onSubmit={handleProfileSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Full Name</label>
                  <Input type="text" placeholder="Your Name" defaultValue="" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
                  <Input type="email" placeholder="you@example.com" defaultValue="" />
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="submit">Save Changes</Button>
                <Button type="button" variant="outline">Cancel</Button>
              </div>
            </form>
          </SectionCard>

          {/* Profile Photo */}
          <SectionCard title="Profile Photo" description="Upload or change your profile picture.">
            <FileUpload
              onFileSelect={(file) => {
                // Database implementation required here — upload profile photo to storage
                console.log("Profile photo selected:", file);
              }}
            />
          </SectionCard>

          {/* Password */}
          <SectionCard title="Password" description="Update your password to keep your account secure.">
            <form onSubmit={handlePasswordSave} className="space-y-4 max-w-md">
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
              <Button type="submit">Update Password</Button>
            </form>
          </SectionCard>

          {/* Danger Zone */}
          <DangerZoneCard
            title="Delete Account"
            description="Permanently delete your account and all associated data. This action cannot be undone."
          >
            <Button variant="danger-outline" onClick={() => setDeleteModalOpen(true)}>
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
