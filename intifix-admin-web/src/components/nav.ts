import {
  ClipboardList,
  LayoutDashboard,
  MessageSquare,
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
  permission?: Permission;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Panel",
    items: [
      { label: "Dashboard", to: "/", icon: LayoutDashboard, permission: Permission.DASHBOARD_VIEW },
    ],
  },
  {
    label: "Gestión",
    items: [
      { label: "Clientes", to: "/usuarios", icon: Users, permission: Permission.USERS_VIEW },
      { label: "Técnicos", to: "/tecnicos", icon: Wrench, permission: Permission.TECHNICIANS_VIEW },
    ],
  },
  {
    label: "Moderación",
    items: [
      { label: "Reportes", to: "/reportes", icon: ClipboardList, permission: Permission.REPORTS_VIEW },
      { label: "Apelaciones", to: "/apelaciones", icon: MessageSquare, permission: Permission.REPORTS_VIEW },
    ],
  },
  {
    label: "Sistema",
    items: [
      { label: "Auditoría", to: "/auditoria", icon: ScrollText, permission: Permission.AUDIT_VIEW },
      { label: "Configuración", to: "/configuracion", icon: Settings },
    ],
  },
];

export const BRAND_ICON = ShieldCheck;
