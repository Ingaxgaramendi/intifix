import { useState } from "react"
import { Link, NavLink, Outlet } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  Wrench,
  Bell,
  LogOut,
  Menu,
  X,
  Home,
  ClipboardList,
  Search,
  CreditCard,
  MessageSquare,
  CalendarDays,
  Star,
  Briefcase,
  FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth-store"
import { useLogout } from "@/features/auth/use-auth"
import { notificationsApi } from "@/api/notifications"
import { paths } from "@/routes/paths"
import type { Role } from "@/types/auth"

interface NavItem {
  to: string
  label: string
  icon: typeof Home
}

const CLIENTE_NAV: NavItem[] = [
  { to: paths.cliente.dashboard, label: "Inicio", icon: Home },
  { to: paths.cliente.servicios, label: "Mis servicios", icon: ClipboardList },
  { to: paths.cliente.buscarTecnicos, label: "Buscar técnicos", icon: Search },
  { to: paths.cliente.pagos, label: "Pagos", icon: CreditCard },
  { to: paths.shared.chat, label: "Chat", icon: MessageSquare },
]

const TECNICO_NAV: NavItem[] = [
  { to: paths.tecnico.dashboard, label: "Inicio", icon: Home },
  { to: paths.tecnico.disponibles, label: "Servicios", icon: Briefcase },
  { to: paths.tecnico.cotizaciones, label: "Cotizaciones", icon: FileText },
  { to: paths.tecnico.asignaciones, label: "Asignaciones", icon: ClipboardList },
  { to: paths.tecnico.agenda, label: "Agenda", icon: CalendarDays },
  { to: paths.tecnico.reputacion, label: "Reputación", icon: Star },
  { to: paths.shared.chat, label: "Chat", icon: MessageSquare },
]

function navForRoles(roles: Role[]): NavItem[] {
  return roles.includes("TECNICO") ? TECNICO_NAV : CLIENTE_NAV
}

function NotificationBell() {
  const { data: count } = useQuery({
    queryKey: ["notifications", "count"],
    queryFn: notificationsApi.count,
    refetchInterval: 60_000,
  })
  return (
    <Link
      to={paths.shared.notificaciones}
      className="relative flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
      aria-label="Notificaciones"
    >
      <Bell className="h-5 w-5" />
      {!!count && count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  )
}

export function AppShell() {
  const { user, correo } = useAuthStore()
  const logout = useLogout()
  const [mobileOpen, setMobileOpen] = useState(false)

  const items = navForRoles(user?.roles ?? [])
  const initials = (correo ?? "U").slice(0, 2).toUpperCase()
  const isTecnico = user?.roles.includes("TECNICO")
  const roleLabel = isTecnico ? "Técnico" : "Cliente"
  const perfilPath = isTecnico ? paths.tecnico.perfil : paths.cliente.perfil

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
      isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
    )

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            to={items[0]?.to ?? paths.landing}
            className="flex items-center gap-2 text-lg font-semibold tracking-tight"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Wrench className="h-5 w-5" />
            </span>
            INTI<span className="-ml-1.5 text-primary">FIX</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {items.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} end className={linkClass}>
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <NotificationBell />
            <div className="hidden items-center gap-2 pl-2 md:flex">
              <Link
                to={perfilPath}
                className="flex items-center gap-3 rounded-full p-1 pr-1.5 transition-colors hover:bg-muted"
              >
                <div className="text-right leading-tight">
                  <p className="max-w-40 truncate text-sm font-medium">{correo}</p>
                  <p className="text-xs text-muted-foreground">{roleLabel}</p>
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {initials}
                </span>
              </Link>
              <button
                onClick={() => logout.mutate()}
                className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Cerrar sesión"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-foreground hover:bg-muted md:hidden"
              aria-label="Menú"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-border bg-background px-4 py-3 md:hidden">
            <nav className="flex flex-col gap-1">
              {items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end
                  onClick={() => setMobileOpen(false)}
                  className={linkClass}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <div className="leading-tight">
                <p className="truncate text-sm font-medium">{correo}</p>
                <p className="text-xs text-muted-foreground">{roleLabel}</p>
              </div>
              <button
                onClick={() => logout.mutate()}
                className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
              >
                <LogOut className="h-4 w-4" />
                Salir
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}
