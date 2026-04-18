import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FloatingRightNav } from "@/components/FloatingRightNav";
import { AdminSectionShell } from "@/components/admin/AdminSectionShell";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { SearchFilterBar } from "@/components/admin/SearchFilterBar";
import { BulkActionsBar } from "@/components/admin/BulkActionsBar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Eye, UserCog, MapPin, MessageSquare, Shield, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserFriendlyErrorMessage } from "@/lib/error-message";
import { hasAdminAccess } from "@/lib/admin";
import {
  bulkUpdateAdminUserRoles,
  deleteAdminUserAccount,
  getAdminRoles,
  getAdminUsers,
  updateAdminUserEmail,
  updateAdminUserPassword,
  updateAdminUserRole,
} from "@/server/admin";
import type { AdminRoleRow, AdminUserRow } from "@/types/admin";

export const Route = createFileRoute("/admin/users")({
  component: UsersPage,
});

function formatDate(value: string | null) {
  if (!value) {
    return "Never";
  }

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRoleName(roleName: string) {
  return roleName
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function UsersPage() {
  const { isLoggedIn, user } = useAuth();
  const canAccessAdmin = hasAdminAccess(user);

  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [roles, setRoles] = useState<AdminRoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [bulkRoleId, setBulkRoleId] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [detailUser, setDetailUser] = useState<AdminUserRow | null>(null);
  const [emailDraft, setEmailDraft] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  async function loadUsersPage(detailUserId?: number | null) {
    try {
      setLoading(true);
      setPageError("");
      const [userRows, roleRows] = await Promise.all([
        getAdminUsers(),
        getAdminRoles(),
      ]);
      if (!Array.isArray(userRows) || !Array.isArray(roleRows)) {
        throw new Error("User management data returned an unexpected response.");
      }

      setUsers(userRows);
      setRoles(roleRows);
      if (detailUserId) {
        const nextDetailUser =
          userRows.find((userRow) => userRow.user_id === detailUserId) ?? null;
        setDetailUser(nextDetailUser);
        if (nextDetailUser) {
          setEmailDraft(nextDetailUser.email);
        }
      }
      return userRows;
    } catch (error) {
      setUsers([]);
      setRoles([]);
      setPageError(
        getUserFriendlyErrorMessage(error, "Could not load users."),
      );
      return [];
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (canAccessAdmin) {
      loadUsersPage();
    }
  }, [canAccessAdmin]);

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

  const filtered = users.filter((userRow) => {
    const query = search.toLowerCase();
    const matchesSearch =
      userRow.display_name.toLowerCase().includes(query) ||
      userRow.email.toLowerCase().includes(query);
    const matchesRole =
      roleFilter === "all" || String(userRow.role_id) === roleFilter;
    const matchesStatus =
      statusFilter === "all" || userRow.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const toggleSelect = (id: number) => {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelected(next);
  };

  const openDetailUser = (userRow: AdminUserRow) => {
    setDetailUser(userRow);
    setEmailDraft(userRow.email);
    setNewPassword("");
    setConfirmNewPassword("");
    setShowDeleteDialog(false);
  };

  const handleRoleChange = async (userId: number, nextRoleId: string) => {
    try {
      setPageError("");
      setActionMessage("");
      await updateAdminUserRole({
        data: {
          userId,
          roleId: Number(nextRoleId),
        },
      });
      setActionMessage("Role updated successfully.");
      await loadUsersPage();
    } catch (error) {
      setPageError(
        getUserFriendlyErrorMessage(error, "Could not update the user role."),
      );
    }
  };

  const handleBulkAssign = async () => {
    if (!bulkRoleId || selected.size === 0) {
      return;
    }

    try {
      setPageError("");
      setActionMessage("");
      await bulkUpdateAdminUserRoles({
        data: {
          userIds: Array.from(selected),
          roleId: Number(bulkRoleId),
        },
      });
      setActionMessage("Selected users were updated successfully.");
      setSelected(new Set());
      setBulkRoleId("");
      await loadUsersPage();
    } catch (error) {
      setPageError(
        getUserFriendlyErrorMessage(error, "Could not update the selected users."),
      );
    }
  };

  const handleEmailUpdate = async () => {
    if (!detailUser) {
      return;
    }

    try {
      setSavingEmail(true);
      setPageError("");
      setActionMessage("");
      await updateAdminUserEmail({
        data: {
          userId: detailUser.user_id,
          email: emailDraft,
        },
      });
      setActionMessage("User email updated successfully.");
      await loadUsersPage(detailUser.user_id);
    } catch (error) {
      setPageError(
        getUserFriendlyErrorMessage(error, "Could not update the user email."),
      );
    } finally {
      setSavingEmail(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!detailUser) {
      return;
    }

    try {
      setSavingPassword(true);
      setPageError("");
      setActionMessage("");
      await updateAdminUserPassword({
        data: {
          userId: detailUser.user_id,
          newPassword,
          confirmNewPassword,
        },
      });
      setActionMessage("User password updated successfully.");
      setNewPassword("");
      setConfirmNewPassword("");
      await loadUsersPage(detailUser.user_id);
    } catch (error) {
      setPageError(
        getUserFriendlyErrorMessage(error, "Could not update the user password."),
      );
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!detailUser) {
      return;
    }

    try {
      setPageError("");
      setActionMessage("");
      await deleteAdminUserAccount({
        data: {
          userId: detailUser.user_id,
        },
      });
      setActionMessage("User account deleted successfully.");
      setShowDeleteDialog(false);
      await loadUsersPage(detailUser.user_id);
    } catch (error) {
      setPageError(
        getUserFriendlyErrorMessage(error, "Could not delete the user account."),
      );
    }
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
                    ...roles.map((roleRow) => ({
                      label: formatRoleName(roleRow.role_name),
                      value: String(roleRow.role_id),
                    })),
                  ],
                  onChange: setRoleFilter,
                },
                {
                  label: "Status",
                  value: statusFilter,
                  options: [
                    { label: "All", value: "all" },
                    { label: "Active", value: "active" },
                    { label: "Inactive", value: "inactive" },
                    { label: "Deleted", value: "deleted" },
                  ],
                  onChange: setStatusFilter,
                },
              ]}
            />

            {selected.size > 0 && (
              <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <UserCog className="h-4 w-4" />
                  Assign a role to the selected users.
                </div>
                <Select value={bulkRoleId} onValueChange={setBulkRoleId}>
                  <SelectTrigger className="w-full rounded-xl sm:w-[220px]">
                    <SelectValue placeholder="Choose role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((roleRow) => (
                      <SelectItem key={roleRow.role_id} value={String(roleRow.role_id)}>
                        {formatRoleName(roleRow.role_name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <BulkActionsBar
              selectedCount={selected.size}
              onClearSelection={() => {
                setSelected(new Set());
                setBulkRoleId("");
              }}
              actions={[
                { label: "Assign Selected Role", onClick: handleBulkAssign },
              ]}
            />

            {actionMessage ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {actionMessage}
              </div>
            ) : null}

            {pageError ? (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {pageError}
              </div>
            ) : null}

            {loading ? (
              <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
                Loading users...
              </div>
            ) : (
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
                    {filtered.map((userRow) => {
                      const isDeleted = userRow.status === "deleted";
                      return (
                        <tr key={userRow.user_id} className={`border-b last:border-0 hover:bg-muted/20 transition-colors ${isDeleted ? "opacity-60" : ""}`}>
                          <td className="p-3"><Checkbox checked={selected.has(userRow.user_id)} onCheckedChange={() => toggleSelect(userRow.user_id)} /></td>
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-warm-200 flex items-center justify-center text-xs font-semibold text-warm-700 overflow-hidden">
                                {userRow.avatar_url ? (
                                  <img src={userRow.avatar_url} alt={userRow.display_name} className="h-full w-full object-cover" />
                                ) : (
                                  getInitials(userRow.display_name)
                                )}
                              </div>
                              <p className="font-medium text-foreground">{userRow.display_name}</p>
                            </div>
                          </td>
                          <td className="p-3 text-muted-foreground hidden md:table-cell">{userRow.email}</td>
                          <td className="p-3">
                            {isDeleted ? (
                              <span className="text-xs text-muted-foreground">{formatRoleName(userRow.role_name)}</span>
                            ) : (
                              <Select value={String(userRow.role_id)} onValueChange={(nextRoleId) => handleRoleChange(userRow.user_id, nextRoleId)}>
                                <SelectTrigger className="h-7 w-[140px] rounded-lg text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {roles.map((roleRow) => (
                                    <SelectItem key={roleRow.role_id} value={String(roleRow.role_id)}>
                                      {formatRoleName(roleRow.role_name)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </td>
                          <td className="p-3 text-muted-foreground text-xs hidden lg:table-cell">{formatDate(userRow.created_at)}</td>
                          <td className="p-3 hidden md:table-cell">
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" /> {userRow.spots_count}
                            </span>
                          </td>
                          <td className="p-3 hidden md:table-cell">
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <MessageSquare className="h-3 w-3" /> {userRow.reviews_count}
                            </span>
                          </td>
                          <td className="p-3"><StatusBadge status={userRow.status} /></td>
                          <td className="p-3">
                            <div className="flex items-center justify-end gap-1">
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg" title="View Profile" onClick={() => openDetailUser(userRow)}>
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
            )}
          </div>
        </AdminSectionShell>
      </div>

      <Sheet open={!!detailUser} onOpenChange={(open) => !open && setDetailUser(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-display">User Profile</SheetTitle>
          </SheetHeader>
          {detailUser && (
            <div className="mt-6 space-y-5">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-warm-200 flex items-center justify-center text-2xl font-semibold text-warm-700 overflow-hidden">
                  {detailUser.avatar_url ? (
                    <img src={detailUser.avatar_url} alt={detailUser.display_name} className="h-full w-full object-cover" />
                  ) : (
                    getInitials(detailUser.display_name)
                  )}
                </div>
                <div>
                  <p className="text-lg font-medium text-foreground">{detailUser.display_name}</p>
                  <p className="text-sm text-muted-foreground">{detailUser.email}</p>
                  <StatusBadge status={detailUser.status} className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Role</p>
                  <p className="font-medium text-foreground">{formatRoleName(detailUser.role_name)}</p>
                </div>
                <div className="rounded-xl bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Joined</p>
                  <p className="font-medium text-foreground">{formatDate(detailUser.created_at)}</p>
                </div>
                <div className="rounded-xl bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Spots Submitted</p>
                  <p className="font-medium text-foreground">{detailUser.spots_count}</p>
                </div>
                <div className="rounded-xl bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Reviews Written</p>
                  <p className="font-medium text-foreground">{detailUser.reviews_count}</p>
                </div>
                <div className="rounded-xl bg-muted/30 p-3 col-span-2">
                  <p className="text-xs text-muted-foreground">Last Login</p>
                  <p className="font-medium text-foreground">{formatDate(detailUser.last_login)}</p>
                </div>
              </div>
              {detailUser.status === "deleted" && (
                <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-4">
                  <p className="text-sm text-destructive font-medium">This account has been deleted.</p>
                  <p className="text-xs text-muted-foreground mt-1">Role changes are disabled for deleted accounts.</p>
                </div>
              )}
              {detailUser.status !== "deleted" ? (
                <>
                  <div className="space-y-3 rounded-xl border border-border p-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">Email Address</p>
                      <p className="text-xs text-muted-foreground">Admins can update the sign-in email for this account.</p>
                    </div>
                    <Input
                      type="email"
                      value={emailDraft}
                      onChange={(event) => setEmailDraft(event.target.value)}
                      className="rounded-xl"
                    />
                    <Button
                      onClick={() => {
                        void handleEmailUpdate();
                      }}
                      disabled={savingEmail || emailDraft.trim().toLowerCase() === detailUser.email.toLowerCase()}
                      className="rounded-xl"
                    >
                      {savingEmail ? "Saving..." : "Save Email"}
                    </Button>
                  </div>

                  <div className="space-y-3 rounded-xl border border-border p-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">Reset Password</p>
                      <p className="text-xs text-muted-foreground">Admins can set a new password directly for this user.</p>
                    </div>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      placeholder="Enter a new password"
                      className="rounded-xl"
                    />
                    <Input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(event) => setConfirmNewPassword(event.target.value)}
                      placeholder="Confirm the new password"
                      className="rounded-xl"
                    />
                    <Button
                      onClick={() => {
                        void handlePasswordUpdate();
                      }}
                      disabled={savingPassword || newPassword.length === 0 || confirmNewPassword.length === 0}
                      className="rounded-xl"
                    >
                      {savingPassword ? "Updating..." : "Update Password"}
                    </Button>
                  </div>

                  <div className="space-y-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                    <div>
                      <p className="text-sm font-medium text-destructive">Delete Account</p>
                      <p className="text-xs text-muted-foreground">This uses the account deletion flow and archives the email so it no longer works for sign-in.</p>
                    </div>
                    <Button
                      variant="destructive"
                      className="rounded-xl"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="mr-1.5 h-4 w-4" />
                      Delete Account
                    </Button>
                  </div>
                </>
              ) : null}
            </div>
          )}
        </SheetContent>
      </Sheet>
      <ConfirmationModal
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete User Account"
        description={
          detailUser
            ? `This will deactivate ${detailUser.display_name}'s account and archive their email address.`
            : "This will deactivate the selected account."
        }
        confirmLabel="Delete Account"
        onConfirm={() => {
          void handleDeleteUser();
        }}
        destructive
      />
    </>
  );
}
