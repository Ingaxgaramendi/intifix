import { Link } from "react-router-dom"
import { ArrowRight, Check, Wrench, User, Briefcase } from "lucide-react"
import { Container } from "@/components/layout/container"
import { Button } from "@/components/shared/button"
import { LandingNav } from "@/components/public/landing-nav"
import { SiteFooter } from "@/components/public/site-footer"
import { Reveal, RevealGroup, RevealItem } from "@/components/public/reveal"
import { paths } from "@/routes/paths"

const PLANES = [
  {
    icon: User,
    audiencia: "Para clientes",
    precio: "Gratis",
    nota: "Solo pagas el servicio que contratas",
    destacado: false,
    features: [
      "Publicar solicitudes sin costo",
      "Recibir cotizaciones de técnicos verificados",
      "Elegir por precio, calificación y cercanía",
      "Chat en tiempo real con tu técnico",
      "Pagos protegidos y comprobante",
    ],
    cta: "Pedir un servicio",
  },
  {
    icon: Briefcase,
    audiencia: "Para técnicos",
    precio: "1%",
    nota: "Comisión solo por servicio cobrado",
    destacado: true,
    features: [
      "Registro y perfil sin mensualidad",
      "Acceso a clientes reales de tu zona",
      "Tú defines tus tarifas y horarios",
      "Cobros garantizados por la plataforma",
      "Reputación y reseñas que te hacen crecer",
    ],
    cta: "Convertirme en técnico",
  },
]

export function PricingPage() {
  return (
    <div id="top" className="flex min-h-screen flex-col bg-background text-foreground">
      <LandingNav />

      <main className="flex-1">
        <section className="relative overflow-hidden pt-32 pb-16 sm:pt-40">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-primary/10 via-background to-background" />
          <div className="animate-float-slow pointer-events-none absolute -right-20 top-24 -z-10 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
          <Container size="lg">
            <Reveal className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <Wrench className="h-4 w-4" />
                Precios
              </span>
              <h1 className="mt-6 font-heading text-4xl font-bold tracking-tight sm:text-5xl">
                Sin mensualidades. <span className="text-gradient-wine">Sin sorpresas.</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
                IntiFix es gratis para clientes. Los técnicos solo pagan una comisión cuando cobran un
                servicio. Así de simple.
              </p>
            </Reveal>
          </Container>
        </section>

        <section className="pb-20">
          <Container size="lg">
            <RevealGroup className="grid gap-6 md:grid-cols-2">
              {PLANES.map((p) => (
                <RevealItem
                  key={p.audiencia}
                  className={
                    p.destacado
                      ? "relative rounded-3xl border-2 border-primary bg-primary/5 p-8 shadow-sm"
                      : "rounded-3xl border border-border bg-card p-8 shadow-sm"
                  }
                >
                  {p.destacado && (
                    <span className="absolute -top-3 left-8 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                      Más popular
                    </span>
                  )}
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <p.icon className="h-6 w-6" />
                  </div>
                  <p className="mt-5 text-sm font-medium text-muted-foreground">{p.audiencia}</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-4xl font-bold tracking-tight">{p.precio}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{p.nota}</p>

                  <ul className="mt-6 space-y-3">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Button className="mt-8 w-full" variant={p.destacado ? "default" : "outline"} asChild>
                    <Link to={paths.register}>
                      {p.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </RevealItem>
              ))}
            </RevealGroup>

            <Reveal className="mx-auto mt-10 max-w-2xl text-center text-sm text-muted-foreground">
              La comisión cubre la operación de la plataforma: verificación, soporte, pagos protegidos
              y la tecnología que te consigue clientes. ¿Dudas?{" "}
              <Link to={paths.about} className="font-medium text-primary hover:underline">
                Conoce más sobre IntiFix
              </Link>
              .
            </Reveal>
          </Container>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
