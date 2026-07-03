import { type ReactNode, useLayoutEffect } from "react"
import { Link } from "react-router-dom"
import { Wrench, ShieldCheck, Star, Clock, ArrowLeft } from "lucide-react"
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
  useLayoutEffect(() => {
    const html = document.documentElement
    const wasLight = !html.classList.contains("dark")
    html.classList.add("dark")
    return () => { if (wasLight) html.classList.remove("dark") }
  }, [])

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[#3d0a14] lg:flex">
        {/* Background video of a technician at work (muted + loop autoplay). */}
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1200&q=80"
        >
          <source src="/auth-video.mp4" type="video/mp4" />
        </video>

        {/* Dark wine overlay for legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#3d0a14] via-[#3d0a14]/80 to-[#3d0a14]/65" />

        {/* Subtle glow accents */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/5 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-28 -left-16 h-96 w-96 rounded-full bg-white/5 blur-3xl"
        />

        <Link to={paths.landing} className="relative z-10 flex items-center gap-2 p-12 pb-0 text-xl font-semibold text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
            <Wrench className="h-5 w-5" />
          </span>
          INTIFIX
        </Link>

        <div className="relative z-10 max-w-md px-12 pb-0 text-white">
          <h2 className="text-balance text-3xl font-bold leading-tight">
            Servicios técnicos confiables, a un clic de distancia.
          </h2>
          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <span className="text-white/90">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 px-12 pb-12 pt-0 text-sm text-white/60">
          © 2026 INTIFIX. Pagos protegidos en cada servicio.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-6 py-12 dark:bg-background">
        <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card px-8 py-10 shadow-lg dark:border-border dark:shadow-2xl">
          {/* Back to landing — always visible */}
          <Link
            to={paths.landing}
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>

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
