import { useState } from "react"
import { Link, NavLink, Outlet, useLocation } from "react-router-dom"
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
  Briefcase,
  FileText,
  PlusCircle,
  Sun,
  Moon,
  Sparkles,
  UserCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth-store"
import { useThemeStore } from "@/stores/theme-store"
import { useTecnicoProfile } from "@/features/profile/use-tecnico-profile"
import { useClienteProfile } from "@/features/profile/use-cliente-profile"
import { useLogout } from "@/features/auth/use-auth"
import { useContadorNoLeidas } from "@/features/notifications/use-notifications"
import { useNotificationsRealtime } from "@/features/notifications/use-notifications-realtime"
import { paths } from "@/routes/paths"
import type { Role } from "@/types/auth"

interface NavItem {
  to: string
  label: string
  icon: typeof Home
}

const CLIENTE_NAV: NavItem[] = [
  { to: paths.cliente.dashboard, label: "Inicio", icon: Home },
  { to: paths.cliente.pedir, label: "Pedir servicio", icon: PlusCircle },
  { to: paths.cliente.servicios, label: "Mis servicios", icon: ClipboardList },
  { to: paths.cliente.buscarTecnicos, label: "Buscar técnicos", icon: Search },
  { to: paths.cliente.pagos, label: "Pagos", icon: CreditCard },
  { to: paths.shared.chat, label: "Chat", icon: MessageSquare },
]

// Especialidades, agenda, ubicación, reputación e ingresos viven en el PERFIL
// del técnico, no aquí: el navbar solo lleva el flujo operativo del día a día.
const TECNICO_NAV: NavItem[] = [
  { to: paths.tecnico.dashboard, label: "Inicio", icon: Home },
  { to: paths.tecnico.disponibles, label: "Servicios", icon: Briefcase },
  { to: paths.tecnico.directas, label: "Directas", icon: UserCheck },
  { to: paths.tecnico.cotizaciones, label: "Cotizaciones", icon: FileText },
  { to: paths.tecnico.asignaciones, label: "Asignaciones", icon: ClipboardList },
  { to: paths.shared.chat, label: "Chat", icon: MessageSquare },
]

function navForRoles(roles: Role[]): NavItem[] {
  return roles.includes("TECNICO") ? TECNICO_NAV : CLIENTE_NAV
}

function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme)
  const toggle = useThemeStore((s) => s.toggle)
  const isDark = theme === "dark"
  return (
    <button
      onClick={toggle}
      className="flex h-10 w-10 items-center justify-center rounded-full text-primary-foreground/80 transition-colors hover:bg-white/10 hover:text-primary-foreground dark:text-foreground/60 dark:hover:bg-white/10 dark:hover:text-foreground"
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={isDark ? "Modo claro" : "Modo oscuro"}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  )
}

function NotificationBell() {
  const { data: count = 0 } = useContadorNoLeidas()
  return (
    <Link
      to={paths.shared.notificaciones}
      className="relative flex h-10 w-10 items-center justify-center rounded-full text-primary-foreground/80 transition-colors hover:bg-white/10 hover:text-primary-foreground dark:text-foreground/60 dark:hover:bg-white/10 dark:hover:text-foreground"
      aria-label="Notificaciones"
    >
      <Bell className="h-5 w-5" />
      {!!count && count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-semibold text-primary">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  )
}

/** FAB flotante "INTI IA" — solo visible para CLIENTES fuera de /asistente. */
function IntiFloatingBtn({ isCliente }: { isCliente: boolean }) {
  const location = useLocation()
  if (!isCliente || location.pathname === paths.shared.asistente) return null

  return (
    <Link
      to={paths.shared.asistente}
      className="group fixed bottom-6 right-6 z-50 flex items-center gap-2 overflow-hidden rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:px-5 hover:shadow-xl hover:shadow-primary/40 active:scale-95"
      aria-label="Abrir INTI IA"
    >
      {/* Glow halo */}
      <span className="absolute inset-0 rounded-full bg-primary opacity-0 blur-md transition-opacity group-hover:opacity-40" />
      <Sparkles className="relative h-5 w-5 shrink-0" />
      <span className="relative max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold transition-all duration-300 group-hover:max-w-20">
        INTI IA
      </span>
    </Link>
  )
}

export function AppShell() {
  const { user, correo } = useAuthStore()
  const logout = useLogout()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Push de notificaciones en tiempo real, activo en toda la app.
  useNotificationsRealtime()

  const items = navForRoles(user?.roles ?? [])
  const initials = (correo ?? "U").slice(0, 2).toUpperCase()
  const isTecnico = user?.roles.includes("TECNICO")
  const isCliente = !isTecnico
  const roleLabel = isTecnico ? "Técnico" : "Cliente"
  const perfilPath = isTecnico ? paths.tecnico.perfil : paths.cliente.perfil

  // Foto de perfil para el avatar del header (técnico o cliente).
  const tecProfile = useTecnicoProfile(isTecnico ? user?.idUsuario : undefined)
  const cliProfile = useClienteProfile(isTecnico ? undefined : user?.idUsuario)
  const fotoPerfil = isTecnico ? tecProfile.data?.fotoPerfilUrl : cliProfile.data?.fotoPerfilUrl

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-all duration-200",
      isActive
        ? "bg-white text-primary shadow-sm dark:bg-primary dark:text-primary-foreground dark:shadow-none"
        : "text-primary-foreground/75 hover:bg-white/10 hover:text-primary-foreground dark:text-foreground/60 dark:hover:bg-white/10 dark:hover:text-foreground",
    )

  return (
    <div className="min-h-screen bg-muted/30 dark:bg-background">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-primary text-primary-foreground shadow-sm dark:border-border dark:bg-background/90 dark:text-foreground dark:shadow-none dark:backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
          <Link
            to={items[0]?.to ?? paths.landing}
            className="flex shrink-0 items-center gap-2 font-heading text-lg font-bold tracking-tight"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-primary-foreground ring-1 ring-white/20 dark:bg-primary/15 dark:text-primary dark:ring-primary/30">
              <Wrench className="h-5 w-5" />
            </span>
            <span className="hidden sm:inline">INTI<span className="-ml-1.5 text-white/55 dark:text-muted-foreground">FIX</span></span>
          </Link>

          {/* Desktop nav: icon-only pills on md, icon+label from lg. */}
          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 md:flex">
            {items.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} end className={linkClass} title={label}>
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden lg:inline">{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <NotificationBell />
            <div className="hidden items-center gap-2 pl-2 md:flex">
              <Link
                to={perfilPath}
                className="flex items-center gap-3 rounded-full p-1 pr-1.5 transition-colors hover:bg-white/10 dark:hover:bg-white/10"
              >
                <div className="hidden text-right leading-tight xl:block">
                  <p className="max-w-40 truncate text-sm font-medium">{correo}</p>
                  <p className="text-xs text-primary-foreground/60 dark:text-muted-foreground">{roleLabel}</p>
                </div>
                {fotoPerfil ? (
                  <img
                    src={fotoPerfil}
                    alt={correo ?? "Perfil"}
                    className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-white/20 dark:ring-border"
                  />
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-sm font-semibold text-primary-foreground ring-1 ring-white/20 dark:bg-primary/20 dark:text-primary dark:ring-primary/30">
                    {initials}
                  </span>
                )}
              </Link>
              <button
                onClick={() => logout.mutate()}
                className="flex h-10 w-10 items-center justify-center rounded-full text-primary-foreground/80 transition-colors hover:bg-white/10 hover:text-primary-foreground dark:text-foreground/60 dark:hover:bg-white/10 dark:hover:text-foreground"
                aria-label="Cerrar sesión"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-primary-foreground/80 hover:bg-white/10 hover:text-primary-foreground dark:text-foreground/60 dark:hover:bg-white/10 dark:hover:text-foreground md:hidden"
              aria-label="Menú"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-white/10 bg-primary px-4 py-3 text-primary-foreground dark:border-border dark:bg-background/95 dark:text-foreground dark:backdrop-blur-xl md:hidden">
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
            <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
              <div className="leading-tight">
                <p className="truncate text-sm font-medium">{correo}</p>
                <p className="text-xs text-primary-foreground/60">{roleLabel}</p>
              </div>
              <button
                onClick={() => logout.mutate()}
                className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-primary-foreground/80 hover:bg-white/10 dark:text-foreground/60 dark:hover:bg-white/10 dark:hover:text-foreground"
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

      {/* Floating INTI IA button — clientes only, hidden on /asistente */}
      <IntiFloatingBtn isCliente={isCliente} />
    </div>
  )
}
