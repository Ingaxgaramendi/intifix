import { NavLink } from "react-router-dom";

import { BRAND_ICON, NAV_ITEMS, SETTINGS_ITEM } from "@/components/nav";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

function itemClasses(active: boolean): string {
  return cn(
    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
    active
      ? "bg-sidebar-accent text-sidebar-foreground"
      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
  );
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { can } = useAuth();
  const items = NAV_ITEMS.filter((item) => can(item.permission));
  const Brand = BRAND_ICON;
  const SettingsIcon = SETTINGS_ITEM.icon;

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
        <Brand className="size-6 text-primary" />
        <span className="text-lg font-semibold tracking-tight">Intifix</span>
        <span className="ml-1 rounded bg-sidebar-accent px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-sidebar-foreground/70">
          Admin
        </span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            onClick={onNavigate}
            className={({ isActive }) => itemClasses(isActive)}
          >
            <item.icon className="size-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <NavLink
          to={SETTINGS_ITEM.to}
          onClick={onNavigate}
          className={({ isActive }) => itemClasses(isActive)}
        >
          <SettingsIcon className="size-4" />
          {SETTINGS_ITEM.label}
        </NavLink>
      </div>
    </div>
  );
}
