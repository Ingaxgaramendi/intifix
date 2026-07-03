import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, ChevronRight, LogOut, Menu, Moon, Search, Settings, Sun, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { api } from "@/lib/api";

const ROUTE_NAMES: Record<string, string> = {
  "/": "Dashboard",
  "/usuarios": "Usuarios",
  "/tecnicos": "Técnicos",
  "/reportes": "Reportes",
  "/auditoria": "Auditoría",
  "/configuracion": "Configuración",
};

interface DashSummary {
  pending_technicians: number;
  open_reports: number;
}

interface SearchUser {
  id: string;
  full_name?: string;
  email?: string;
  nombre?: string;
  correo?: string;
}

function GlobalSearch() {
  const navigate = useNavigate();
  const [raw, setRaw] = useState("");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce: update q 300ms after the user stops typing.
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setQ(raw.trim()), 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [raw]);

  // Close on click-outside.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const users = useQuery({
    queryKey: ["search-users", q],
    enabled: q.length >= 2,
    queryFn: async () =>
      (await api.get<{ results: SearchUser[] }>("/api/admin/users/", { params: { search: q, page_size: 5 } })).data.results ?? [],
  });

  const technicians = useQuery({
    queryKey: ["search-technicians", q],
    enabled: q.length >= 2,
    queryFn: async () =>
      (await api.get<{ results: SearchUser[] }>("/api/admin/technicians/", { params: { search: q, page_size: 5 } })).data.results ?? [],
  });

  const hasResults = (users.data?.length ?? 0) > 0 || (technicians.data?.length ?? 0) > 0;
  const isLoading = users.isLoading || technicians.isLoading;

  const nameOf = (u: SearchUser) => u.full_name ?? u.nombre ?? u.email ?? u.correo ?? u.id;
  const emailOf = (u: SearchUser) => u.email ?? u.correo;

  const goTo = (path: string) => {
    setOpen(false);
    setRaw("");
    setQ("");
    navigate(path);
  };

  return (
    <div ref={containerRef} className="relative hidden md:flex items-center">
      <Search className="absolute left-3 size-3.5 text-muted-foreground pointer-events-none" />
      <input
        value={raw}
        onChange={(e) => { setRaw(e.target.value); if (e.target.value.trim().length >= 2) setOpen(true); }}
        onFocus={() => { if (q.length >= 2) setOpen(true); }}
        onKeyDown={(e) => {
          if (e.key === "Escape") { setOpen(false); setRaw(""); setQ(""); }
          if (e.key === "Enter" && q) {
            const moreUsers = (users.data?.length ?? 0) >= (technicians.data?.length ?? 0);
            goTo(moreUsers ? `/usuarios?search=${encodeURIComponent(q)}` : `/tecnicos?search=${encodeURIComponent(q)}`);
          }
        }}
        placeholder="Buscar usuario o técnico…"
        className="h-8 w-52 rounded-md border bg-muted/40 pl-8 pr-8 text-sm placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-all"
      />
      {raw && (
        <button
          onClick={() => { setRaw(""); setQ(""); setOpen(false); }}
          className="absolute right-2 text-muted-foreground hover:text-foreground"
          aria-label="Limpiar"
        >
          <X className="size-3" />
        </button>
      )}

      {open && q.length >= 2 && (
        <div className="absolute right-0 top-10 z-50 w-80 rounded-xl border bg-card p-1 shadow-xl">
          {isLoading && (
            <p className="px-3 py-2 text-xs text-muted-foreground">Buscando…</p>
          )}
          {!isLoading && !hasResults && (
            <p className="px-3 py-2 text-xs text-muted-foreground">Sin resultados para "{q}"</p>
          )}

          {(users.data?.length ?? 0) > 0 && (
            <>
              <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Usuarios
              </p>
              {users.data!.map((u) => (
                <button
                  key={u.id}
                  onClick={() => goTo(`/usuarios?search=${encodeURIComponent(nameOf(u))}`)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-muted transition-colors"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {nameOf(u).slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{nameOf(u)}</p>
                    {emailOf(u) && <p className="truncate text-xs text-muted-foreground">{emailOf(u)}</p>}
                  </div>
                </button>
              ))}
            </>
          )}

          {(technicians.data?.length ?? 0) > 0 && (
            <>
              <p className="mt-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Técnicos
              </p>
              {technicians.data!.map((t) => (
                <button
                  key={t.id}
                  onClick={() => goTo(`/tecnicos?search=${encodeURIComponent(nameOf(t))}`)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-muted transition-colors"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                    {nameOf(t).slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{nameOf(t)}</p>
                    {emailOf(t) && <p className="truncate text-xs text-muted-foreground">{emailOf(t)}</p>}
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function Topbar({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const { principal, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const qc = useQueryClient();

  const dashSummary = qc.getQueryData<DashSummary>(["dashboard", "summary"]);
  const notifCount = (dashSummary?.pending_technicians ?? 0) + (dashSummary?.open_reports ?? 0);

  const initials = (principal?.email ?? "?").slice(0, 2).toUpperCase();
  const pageName = ROUTE_NAMES[pathname] ?? "Panel";

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onOpenSidebar}
        aria-label="Abrir menú"
      >
        <Menu />
      </Button>

      {/* Breadcrumb */}
      <nav className="hidden items-center gap-1.5 text-sm lg:flex">
        <span className="text-muted-foreground">Intifix</span>
        <ChevronRight className="size-3.5 text-muted-foreground" />
        <span className="font-medium">{pageName}</span>
      </nav>

      <div className="ml-auto flex items-center gap-1.5">
        <GlobalSearch />

        {/* Theme toggle */}
        <Button variant="ghost" size="icon" onClick={toggle} aria-label="Cambiar tema">
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>

        {/* Notification bell */}
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => navigate("/reportes")}
          aria-label="Notificaciones"
        >
          <Bell className="size-4" />
          {notifCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {notifCount > 9 ? "9+" : notifCount}
            </span>
          )}
        </Button>

        {/* User dropdown */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent transition-colors">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {initials}
              </span>
              <span className="hidden text-sm font-medium sm:inline">
                {principal?.email?.split("@")[0] ?? "Admin"}
              </span>
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="z-50 min-w-56 animate-fade-in rounded-lg border bg-card p-1 text-card-foreground shadow-lg"
            >
              <div className="px-2 py-2">
                <p className="text-sm font-semibold">{principal?.email?.split("@")[0] ?? "Admin"}</p>
                <p className="text-xs text-muted-foreground">{principal?.email}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {principal?.roles.join(", ") || "sin rol"}
                </p>
              </div>
              <DropdownMenu.Separator className="my-1 h-px bg-border" />
              <DropdownMenu.Item
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none hover:bg-accent"
                onSelect={toggle}
              >
                {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                Tema {theme === "dark" ? "claro" : "oscuro"}
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none hover:bg-accent"
                onSelect={() => navigate("/configuracion")}
              >
                <Settings className="size-4" /> Configuración
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="my-1 h-px bg-border" />
              <DropdownMenu.Item
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-destructive outline-none hover:bg-destructive/10"
                onSelect={handleLogout}
              >
                <LogOut className="size-4" /> Cerrar sesión
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
