export const CANONICAL_ADMIN_ROLES = [
  "super_admin",
  "admin",
  "talent_manager",
  "operations_manager",
  "billing_manager",
  "support_manager",
] as const;

export const LEGACY_ADMIN_ROLES = [
  "operations_admin",
  "vetting_admin",
  "finance_admin",
  "support_admin",
] as const;

export const ALL_ADMIN_ROLES = [
  ...CANONICAL_ADMIN_ROLES,
  ...LEGACY_ADMIN_ROLES,
] as const;

export const isAdminRole = (role: string | null | undefined) => {
  if (!role) return false;
  return (ALL_ADMIN_ROLES as readonly string[]).includes(role);
};

export const isSuperAdminRole = (role: string | null | undefined) => role === "super_admin";
