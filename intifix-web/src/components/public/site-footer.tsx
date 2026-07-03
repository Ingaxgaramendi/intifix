import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { Wrench, Heart, Mail, MessageCircle, Globe } from "lucide-react"
import { Container } from "@/components/layout/container"
import { paths } from "@/routes/paths"

const ESPECIALIDADES = [
  "Plomería",
  "Electricidad",
  "Electrodomésticos",
  "Carpintería",
  "Pintura",
  "Gasfitería",
]

/** Shared wine-themed footer used across all public pages (landing, about, pricing). */
export function SiteFooter() {
  return (
    <footer className="relative mt-auto overflow-hidden bg-[#26090f] text-white/75">
      <div className="animate-float-slow pointer-events-none absolute -top-24 left-1/2 h-64 w-[40rem] -translate-x-1/2 rounded-full bg-primary/30 blur-3xl" />
      <Container size="xl" className="relative">
        <div className="grid gap-10 py-16 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 font-heading text-xl font-bold text-white">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary ring-1 ring-white/20">
                <Wrench className="h-5 w-5" />
              </span>
              INTI<span className="text-rose-300">FIX</span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">
              Conectamos tu problema con el técnico verificado correcto, en minutos. Plomería,
              electricidad, electrodomésticos, carpintería y más — con recomendación inteligente.
            </p>
            <div className="mt-6 flex gap-3">
              {[
                { icon: Mail, label: "Correo", href: "mailto:hola@intifix.com" },
                { icon: MessageCircle, label: "WhatsApp", href: "#top" },
                { icon: Globe, label: "Web", href: "#top" },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 transition-colors hover:border-primary/50 hover:bg-primary hover:text-white"
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Producto */}
          <FooterColumn title="Producto">
            <FooterLink href="/#como-funciona">Cómo funciona</FooterLink>
            <FooterLink href="/#especialidades">Especialidades</FooterLink>
            <FooterLink href="/#beneficios">Beneficios</FooterLink>
            <FooterLink href="/#precios">Precios</FooterLink>
          </FooterColumn>

          {/* Empresa */}
          <FooterColumn title="Empresa">
            <FooterLink href="/#nosotros">Nosotros</FooterLink>
            <FooterLink href="/#testimonios">Testimonios</FooterLink>
            <FooterLink to={paths.login}>Iniciar sesión</FooterLink>
            <FooterLink to={paths.register}>Crear cuenta</FooterLink>
          </FooterColumn>

          {/* Especialidades */}
          <FooterColumn title="Especialidades">
            {ESPECIALIDADES.map((label) => (
              <FooterLink key={label} to={paths.register}>
                {label}
              </FooterLink>
            ))}
          </FooterColumn>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 py-6 text-sm text-white/55 sm:flex-row">
          <span>© {new Date().getFullYear()} IntiFix. Todos los derechos reservados.</span>
          <span className="flex items-center gap-1.5">
            Hecho con <Heart className="h-4 w-4 fill-rose-400 text-rose-400" /> en Perú
          </span>
        </div>
      </Container>

      {/* Giant ghosted wordmark */}
      <div aria-hidden className="pointer-events-none select-none px-4 text-center">
        <span className="block font-heading text-[19vw] font-black leading-[0.8] text-white/3">
          INTIFIX
        </span>
      </div>
    </footer>
  )
}

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-white">{title}</h3>
      <ul className="mt-4 space-y-2.5">{children}</ul>
    </div>
  )
}

function FooterLink({ href, to, children }: { href?: string; to?: string; children: ReactNode }) {
  const cls = "text-sm text-white/60 transition-colors hover:text-rose-300"
  return (
    <li>
      {to ? (
        <Link to={to} className={cls}>
          {children}
        </Link>
      ) : (
        <a href={href} className={cls}>
          {children}
        </a>
      )}
    </li>
  )
}
