import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { Wrench, ShieldCheck, Star, Clock } from "lucide-react"
import { paths } from "@/routes/paths"

const HIGHLIGHTS = [
  { icon: ShieldCheck, text: "Técnicos verificados y aprobados" },
  { icon: Star, text: "Calificaciones reales de cada servicio" },
  { icon: Clock, text: "Respuesta en minutos, no en días" },
]

/** Two-pane auth shell: warm brand panel + form. Collapses to form-only on mobile. */
export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-primary-foreground/10 blur-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-28 -left-16 h-80 w-80 rounded-full bg-primary-foreground/10 blur-2xl"
        />
        <Link to={paths.landing} className="flex items-center gap-2 text-xl font-semibold">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-foreground/15">
            <Wrench className="h-5 w-5" />
          </span>
          INTIFIX
        </Link>

        <div className="relative max-w-md">
          <h2 className="text-balance text-3xl font-bold leading-tight">
            Servicios técnicos confiables, a un clic de distancia.
          </h2>
          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-foreground/15">
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <span className="text-primary-foreground/90">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-primary-foreground/70">
          © 2026 INTIFIX. Pagos protegidos en cada servicio.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Link
            to={paths.landing}
            className="mb-8 inline-flex items-center gap-2 text-lg font-semibold lg:hidden"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Wrench className="h-5 w-5" />
            </span>
            INTIFIX
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-2 text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  )
}
