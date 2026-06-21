import {
  ClipboardList,
  LayoutDashboard,
  ScrollText,
  Settings,
  ShieldCheck,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import { Permission } from "@/lib/rbac";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  /** Item is shown only if the principal holds this permission. */
  permission: Permission;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard, permission: Permission.DASHBOARD_VIEW },
  { label: "Usuarios", to: "/usuarios", icon: Users, permission: Permission.USERS_VIEW },
  { label: "Técnicos", to: "/tecnicos", icon: Wrench, permission: Permission.TECHNICIANS_VIEW },
  // Pagos: temporarily hidden until the backend payments module is reintroduced.
  { label: "Reportes", to: "/reportes", icon: ClipboardList, permission: Permission.REPORTS_VIEW },
  { label: "Auditoría", to: "/auditoria", icon: ScrollText, permission: Permission.AUDIT_VIEW },
];

// Settings is always available to an authenticated admin.
export const SETTINGS_ITEM = {
  label: "Configuración",
  to: "/configuracion",
  icon: Settings,
};

export const BRAND_ICON = ShieldCheck;
