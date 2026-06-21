/**
 * Client-side mirror of the backend RBAC model (shared/domain/rbac.py).
 *
 * The backend remains the source of truth and re-checks every request; this
 * mirror only drives the UI (hide/disable actions the principal cannot perform)
 * for a clean least-privilege experience.
 */

export const Permission = {
  DASHBOARD_VIEW: "dashboard.view",
  USERS_VIEW: "users.view",
  USERS_SUSPEND: "users.suspend",
  USERS_ACTIVATE: "users.activate",
  USERS_BAN: "users.ban",
  USERS_BLOCK: "users.block",
  USERS_UNBLOCK: "users.unblock",
  TECHNICIANS_VIEW: "technicians.view",
  TECHNICIANS_DOCUMENTS_VIEW: "technicians.documents.view",
  TECHNICIANS_APPROVE: "technicians.approve",
  TECHNICIANS_REJECT: "technicians.reject",
  TECHNICIANS_SUSPEND: "technicians.suspend",
  REPORTS_VIEW: "reports.view",
  REPORTS_REVIEW: "reports.review",
  REPORTS_RESOLVE: "reports.resolve",
  REPORTS_COMMENT: "reports.comment",
  PAYMENTS_VIEW: "payments.view",
  PAYMENTS_REFUND: "payments.refund",
  SUPPORT_VIEW: "support.view",
  AUDIT_VIEW: "audit.view",
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

export type Role = "super_admin" | "admin" | "moderador" | "soporte" | "auditor";

const VIEW: Permission[] = [
  Permission.DASHBOARD_VIEW,
  Permission.USERS_VIEW,
  Permission.TECHNICIANS_VIEW,
  Permission.TECHNICIANS_DOCUMENTS_VIEW,
  Permission.REPORTS_VIEW,
  Permission.PAYMENTS_VIEW,
  Permission.SUPPORT_VIEW,
];

const ALL = Object.values(Permission);

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: ALL,
  admin: ALL,
  moderador: [
    Permission.DASHBOARD_VIEW,
    Permission.USERS_VIEW,
    Permission.USERS_SUSPEND,
    Permission.USERS_ACTIVATE,
    Permission.USERS_BLOCK,
    Permission.USERS_UNBLOCK,
    Permission.TECHNICIANS_VIEW,
    Permission.TECHNICIANS_DOCUMENTS_VIEW,
    Permission.TECHNICIANS_APPROVE,
    Permission.TECHNICIANS_REJECT,
    Permission.TECHNICIANS_SUSPEND,
    Permission.REPORTS_VIEW,
    Permission.REPORTS_REVIEW,
    Permission.REPORTS_RESOLVE,
    Permission.REPORTS_COMMENT,
  ],
  soporte: [...VIEW, Permission.REPORTS_COMMENT],
  auditor: [...VIEW, Permission.AUDIT_VIEW],
};

const ROLE_ALIASES: Record<string, Role> = {
  superadmin: "super_admin",
  administrator: "admin",
  moderator: "moderador",
  support: "soporte",
};

export function normalizeRole(value: string): Role | null {
  const n = value.trim().toLowerCase().replace(/-/g, "_");
  if (n in ROLE_PERMISSIONS) return n as Role;
  return ROLE_ALIASES[n] ?? null;
}

export function permissionsFor(roles: string[]): Set<Permission> {
  const granted = new Set<Permission>();
  for (const raw of roles ?? []) {
    const role = normalizeRole(raw);
    if (role) for (const p of ROLE_PERMISSIONS[role]) granted.add(p);
  }
  return granted;
}
