import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { NavLink } from "react-router-dom";

import { BRAND_ICON, NAV_GROUPS } from "@/components/nav";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}

interface DashSummary {
  pending_technicians: number;
  open_reports: number;
}

export function SidebarContent({ collapsed, onToggle, onNavigate }: SidebarProps) {
  const { can, principal } = useAuth();
  const qc = useQueryClient();

  const dashSummary = qc.getQueryData<DashSummary>(["dashboard", "summary"]);
  const badges: Record<string, number> = {
    "/tecnicos": dashSummary?.pending_technicians ?? 0,
    "/reportes": dashSummary?.open_reports ?? 0,
  };

  const displayName = (principal?.email ?? "").split("@")[0];
  const initials = displayName.slice(0, 2).toUpperCase() || "AD";
  const firstRole = principal?.roles[0] ?? "admin";

  const Brand = BRAND_ICON;

  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.permission || can(item.permission)),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Header */}
      <div
        className={cn(
          "flex h-16 shrink-0 items-center border-b border-sidebar-border",
          collapsed ? "justify-center px-3" : "gap-2 px-4",
        )}
      >
        <Brand className="size-6 shrink-0 text-primary" />
        {!collapsed && (
          <>
            <span className="text-lg font-semibold tracking-tight">Intifix</span>
            <span className="ml-1 rounded bg-sidebar-accent px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-sidebar-foreground/60">
              Admin
            </span>
          </>
        )}
        <button
          onClick={onToggle}
          title={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          className={cn(
            "flex size-6 items-center justify-center rounded text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors",
            collapsed ? "mt-0" : "ml-auto",
          )}
        >
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3">
        {visibleGroups.map((group) => (
          <div key={group.label} className={cn("mb-1", collapsed ? "px-2" : "px-3")}>
            {!collapsed && (
              <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const badge = badges[item.to] ?? 0;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/"}
                    onClick={onNavigate}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      cn(
                        "group relative flex items-center rounded-lg transition-colors",
                        collapsed
                          ? "size-10 justify-center"
                          : "gap-3 px-3 py-2 text-sm font-medium",
                        isActive
                          ? [
                              "bg-sidebar-accent text-sidebar-foreground",
                              !collapsed && "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-0.5 before:rounded-r before:bg-primary",
                            ]
                          : "text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                      )
                    }
                  >
                    <item.icon className="size-4 shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1">{item.label}</span>
                        {badge > 0 && (
                          <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                            {badge > 99 ? "99+" : badge}
                          </span>
                        )}
                      </>
                    )}
                    {collapsed && badge > 0 && (
                      <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                        {badge > 9 ? "9+" : badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User card */}
      <div className="shrink-0 border-t border-sidebar-border p-3">
        <div
          className={cn(
            "flex items-center",
            collapsed ? "justify-center" : "gap-3",
          )}
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-sidebar-foreground">{displayName}</p>
              <Badge variant="secondary" className="mt-0.5 text-[10px] px-1.5 py-0">
                {firstRole}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
