import { Link } from "react-router-dom"
import {
  ArrowRight,
  Droplets,
  Zap,
  Hammer,
  PaintRoller,
  Wind,
  Wrench,
  Search,
  ClipboardCheck,
  ShieldCheck,
  Clock,
  Star,
} from "lucide-react"
import { Container } from "@/components/layout/container"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/shared/button"
import { LandingNav } from "@/components/public/landing-nav"
import { Reveal, RevealGroup, RevealItem } from "@/components/public/reveal"
import { paths } from "@/routes/paths"

const STEPS = [
  {
    icon: Search,
    title: "Describe tu problema",
    text: "Cuéntanos qué necesitas reparar. Nuestra IA clasifica el problema y entiende lo que pasa.",
  },
  {
    icon: ClipboardCheck,
    title: "Recibe recomendaciones",
    text: "Te sugerimos los mejores técnicos verificados según calificación, especialidad y disponibilidad.",
  },
  {
    icon: Wrench,
    title: "Resuelve y califica",
    text: "El técnico llega, soluciona el problema y tú calificas el servicio. Así mejoramos las recomendaciones.",
  },
]

const ESPECIALIDADES = [
  { icon: Droplets, label: "Plomería" },
  { icon: Zap, label: "Electricidad" },
  { icon: Wind, label: "Electrodomésticos" },
  { icon: Hammer, label: "Carpintería" },
  { icon: PaintRoller, label: "Pintura" },
  { icon: Wrench, label: "Gasfitería" },
]

const BENEFICIOS = [
  {
    icon: ShieldCheck,
    title: "Técnicos verificados",
    text: "Cada profesional pasa un proceso de aprobación. Sin sorpresas, sin riesgos.",
  },
  {
    icon: Star,
    title: "Recomendación inteligente",
    text: "Un motor de IA prioriza por calificación, coincidencia y disponibilidad real.",
  },
  {
    icon: Clock,
    title: "Rápido y transparente",
    text: "Cotizaciones claras, seguimiento del servicio y pagos sin complicaciones.",
  },
]

const TESTIMONIOS = [
  {
    quote: "Tenía una fuga a medianoche y en minutos ya tenía un gasfitero confiable en camino. Increíble.",
    name: "María L.",
    role: "Cliente",
  },
  {
    quote: "Como técnico, IntiFix me conecta con clientes reales de mi zona. Mi agenda no para.",
    name: "Carlos R.",
    role: "Electricista",
  },
  {
    quote: "La recomendación fue exacta: el técnico sabía justo del problema de mi lavadora.",
    name: "Andrea P.",
    role: "Cliente",
  },
]

function SectionHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
        {eyebrow}
      </span>
      <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 text-muted-foreground">{subtitle}</p>}
    </div>
  )
}

export function LandingPage() {
  return (
    <div id="top" className="flex min-h-screen flex-col bg-background text-foreground">
      <LandingNav />

      <main className="flex-1">
        {/* ---------------- HERO ---------------- */}
        <section className="relative overflow-hidden pt-32 pb-24 sm:pt-40">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
          <Container size="xl">
            <Reveal className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-4 py-1.5 text-sm font-medium text-muted-foreground">
                <Wrench className="h-4 w-4 text-primary" />
                Servicios técnicos a domicilio, sin vueltas
              </span>
              <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl">
                El técnico correcto,{" "}
                <span className="text-primary">cuando lo necesitas</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
                Plomería, electricidad, electrodomésticos y más. Describe tu problema y deja que IntiFix
                te recomiende a los mejores técnicos verificados de tu zona.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button size="lg" asChild>
                  <Link to={paths.register}>
                    Solicitar un servicio
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to={paths.login}>Ya tengo cuenta</Link>
                </Button>
              </div>
            </Reveal>
          </Container>
        </section>

        {/* ---------------- CÓMO FUNCIONA ---------------- */}
        <section id="como-funciona" className="py-20">
          <Container size="xl">
            <Reveal>
              <SectionHeading
                eyebrow="Cómo funciona"
                title="Tres pasos para resolverlo"
                subtitle="De un problema a una solución, con tecnología que te acompaña."
              />
            </Reveal>
            <RevealGroup className="mt-12 grid gap-6 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <RevealItem
                  key={step.title}
                  className="rounded-2xl border border-border bg-card p-7 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <div className="mt-5 text-sm font-semibold text-primary">Paso {i + 1}</div>
                  <h3 className="mt-1 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.text}</p>
                </RevealItem>
              ))}
            </RevealGroup>
          </Container>
        </section>

        {/* ---------------- ESPECIALIDADES ---------------- */}
        <section id="especialidades" className="bg-muted/40 py-20">
          <Container size="xl">
            <Reveal>
              <SectionHeading
                eyebrow="Especialidades"
                title="Para casi cualquier reparación"
                subtitle="Conectamos cada problema con el especialista adecuado."
              />
            </Reveal>
            <RevealGroup className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {ESPECIALIDADES.map((esp) => (
                <RevealItem
                  key={esp.label}
                  className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center shadow-sm"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <esp.icon className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-medium">{esp.label}</span>
                </RevealItem>
              ))}
            </RevealGroup>
          </Container>
        </section>

        {/* ---------------- BENEFICIOS ---------------- */}
        <section id="beneficios" className="py-20">
          <Container size="xl">
            <Reveal>
              <SectionHeading eyebrow="Beneficios" title="Por qué elegir IntiFix" />
            </Reveal>
            <RevealGroup className="mt-12 grid gap-6 md:grid-cols-3">
              {BENEFICIOS.map((b) => (
                <RevealItem
                  key={b.title}
                  className="rounded-2xl border border-border bg-card p-7 shadow-sm"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <b.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{b.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{b.text}</p>
                </RevealItem>
              ))}
            </RevealGroup>
          </Container>
        </section>

        {/* ---------------- TESTIMONIOS ---------------- */}
        <section id="testimonios" className="bg-muted/40 py-20">
          <Container size="xl">
            <Reveal>
              <SectionHeading eyebrow="Testimonios" title="Historias que reparan confianza" />
            </Reveal>
            <RevealGroup className="mt-12 grid gap-6 md:grid-cols-3">
              {TESTIMONIOS.map((t) => (
                <RevealItem
                  key={t.name}
                  className="flex flex-col rounded-2xl border border-border bg-card p-7 shadow-sm"
                >
                  <div className="flex gap-1 text-primary">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="mt-4 flex-1 text-sm text-muted-foreground">“{t.quote}”</p>
                  <div className="mt-5">
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>
          </Container>
        </section>

        {/* ---------------- CTA ---------------- */}
        <section className="py-20">
          <Container size="lg">
            <Reveal className="rounded-3xl border border-border bg-primary/5 p-10 text-center sm:p-14">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                ¿Algo que reparar hoy?
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
                Crea tu cuenta gratis y recibe recomendaciones de técnicos en minutos.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button size="lg" asChild>
                  <Link to={paths.register}>
                    Empezar ahora
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="ghost" asChild>
                  <Link to={paths.login}>Iniciar sesión</Link>
                </Button>
              </div>
            </Reveal>
          </Container>
        </section>
      </main>

      <Footer>
        <div className="flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Wrench className="h-4 w-4" />
            </span>
            INTI<span className="-ml-1 text-primary">FIX</span>
          </div>
          <span>© {new Date().getFullYear()} IntiFix. Todos los derechos reservados.</span>
        </div>
      </Footer>
    </div>
  )
}
