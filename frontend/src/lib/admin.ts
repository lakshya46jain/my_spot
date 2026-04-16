export const ADMIN_ROLE_NAMES = ["admin", "moderator", "owner"] as const;

export function normalizeRoleName(roleName?: string | null) {
  return roleName?.trim().toLowerCase() ?? "";
}

export function hasAdminAccess(
  user?: { roleName?: string | null } | null,
) {
  return ADMIN_ROLE_NAMES.includes(
    normalizeRoleName(user?.roleName) as (typeof ADMIN_ROLE_NAMES)[number],
  );
}
