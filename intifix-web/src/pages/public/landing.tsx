import { useLayoutEffect } from "react"
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
  Sparkles,
  HeartHandshake,
  Target,
  User,
  Briefcase,
  Check,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Container } from "@/components/layout/container"
import { Button } from "@/components/shared/button"
import { LandingNav } from "@/components/public/landing-nav"
import { CountUp } from "@/components/public/count-up"
import { SiteFooter } from "@/components/public/site-footer"
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

const STATS = [
  { to: 5000, suffix: "+", label: "Técnicos registrados" },
  { to: 50000, suffix: "+", label: "Servicios realizados" },
  { to: 98, suffix: "%", label: "Clientes satisfechos" },
  { to: 15, suffix: " min", label: "Respuesta promedio" },
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

const VALORES = [
  {
    icon: ShieldCheck,
    title: "Confianza primero",
    text: "Cada técnico pasa un proceso de verificación. Sin sorpresas, sin riesgos para tu hogar.",
  },
  {
    icon: Sparkles,
    title: "Tecnología útil",
    text: "Usamos IA para entender tu problema y conectarte con el especialista correcto en minutos.",
  },
  {
    icon: HeartHandshake,
    title: "Gana-gana",
    text: "Clientes resuelven rápido; técnicos acceden a clientes reales de su zona y crecen.",
  },
  {
    icon: Target,
    title: "Transparencia",
    text: "Cotizaciones claras, seguimiento del servicio y pagos sin letras chicas.",
  },
]

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

function SectionHeading({
  eyebrow,
  title,
  subtitle,
  gradient = false,
}: {
  eyebrow: string
  title: string
  subtitle?: string
  gradient?: boolean
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        {eyebrow}
      </span>
      <h2
        className={cn(
          "mt-4 font-heading text-3xl font-bold tracking-tight sm:text-4xl",
          gradient && "text-gradient-wine",
        )}
      >
        {title}
      </h2>
      {subtitle && <p className="mt-3 text-muted-foreground">{subtitle}</p>}
    </div>
  )
}

export function LandingPage() {
  // Landing siempre en dark mode permanente.
  useLayoutEffect(() => {
    const html = document.documentElement
    const wasLight = !html.classList.contains("dark")
    html.classList.add("dark")
    return () => {
      if (wasLight) html.classList.remove("dark")
    }
  }, [])

  return (
    <div id="top" className="flex min-h-screen flex-col bg-background text-foreground">
      <LandingNav />

      <main className="flex-1">
        {/* ---------------- HERO (video background) ---------------- */}
        <section className="relative flex min-h-screen items-center overflow-hidden bg-[#3a0f17] pt-24">
          {/* Full-bleed background video, Apple-style. Muted + loop so it can
              autoplay; wine-tinted dark overlays keep the copy legible.
              z-0 (not -z-10) so it sits ABOVE the section's wine fallback bg. */}
          <div className="absolute inset-0 z-0">
            <video
              className="h-full w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
            >
              <source src="/hero.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-primary/25 mix-blend-multiply" />
            {/* Vignette only: dark top (nav legibility) + dark bottom (scroll cue),
                clear in the middle. No fade-to-white at the bottom. */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/15 to-black/45" />
          </div>

          <Container size="xl" className="relative z-10">
            <Reveal className="mx-auto max-w-3xl text-center text-white">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90 backdrop-blur-sm">
                <Wrench className="h-4 w-4" />
                Servicios técnicos a domicilio, sin vueltas
              </span>
              <h1 className="mt-6 text-4xl font-bold tracking-tight drop-shadow-sm sm:text-6xl">
                El técnico correcto,{" "}
                <span className="text-rose-300">cuando lo necesitas</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-white/85 drop-shadow-sm">
                Plomería, electricidad, electrodomésticos y más. Describe tu problema y deja que IntiFix
                te recomiende a los mejores técnicos verificados de tu zona.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90" asChild>
                  <Link to={paths.register}>
                    Solicitar un servicio
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/40 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
                  asChild
                >
                  <Link to={paths.login}>Ya tengo cuenta</Link>
                </Button>
              </div>
            </Reveal>
          </Container>

          {/* Scroll cue */}
          <a
            href="#como-funciona"
            aria-label="Desplázate para ver más"
            className="absolute inset-x-0 bottom-6 z-10 mx-auto flex w-fit flex-col items-center gap-1 text-white/70 transition-colors hover:text-white"
          >
            <span className="text-xs font-medium uppercase tracking-widest">Descubre más</span>
            <span className="flex h-9 w-6 items-start justify-center rounded-full border-2 border-white/40 p-1">
              <span className="h-2 w-1 animate-bounce rounded-full bg-white/80" />
            </span>
          </a>
        </section>

        {/* ---------------- ESTADÍSTICAS (banda vino) ---------------- */}
        <section className="animate-wine-pan relative overflow-hidden bg-gradient-to-br from-primary via-[#5e1822] to-[#3a0f17] py-16 text-white">
          <div className="animate-float-slow pointer-events-none absolute -left-16 top-0 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <div
            className="animate-float-slow pointer-events-none absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-rose-300/10 blur-3xl"
            style={{ animationDelay: "2s" }}
          />
          <Container size="xl" className="relative">
            <RevealGroup className="grid grid-cols-2 gap-8 lg:grid-cols-4">
              {STATS.map((stat) => (
                <RevealItem key={stat.label} className="text-center">
                  <div className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">
                    <CountUp to={stat.to} suffix={stat.suffix} />
                  </div>
                  <div className="mt-2 text-sm font-medium text-white/75">{stat.label}</div>
                </RevealItem>
              ))}
            </RevealGroup>
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
                  className="group relative overflow-hidden rounded-2xl border border-border bg-card p-7 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10"
                >
                  {/* big ghosted step number */}
                  <span className="pointer-events-none absolute -right-2 -top-4 font-heading text-7xl font-black text-primary/5 transition-colors group-hover:text-primary/10">
                    {i + 1}
                  </span>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
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

        {/* ---------------- ESPECIALIDADES (marquee) ---------------- */}
        <section id="especialidades" className="overflow-hidden bg-muted/40 py-20">
          <Container size="xl">
            <Reveal>
              <SectionHeading
                eyebrow="Especialidades"
                title="Para casi cualquier reparación"
                subtitle="Conectamos cada problema con el especialista adecuado."
                gradient
              />
            </Reveal>
          </Container>

          {/* Infinite, edge-faded marquee of specialties (two copies → seamless loop). */}
          <div className="marquee-mask relative mt-12 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
            <div className="flex w-max animate-marquee gap-4 pr-4">
              {[...ESPECIALIDADES, ...ESPECIALIDADES].map((esp, i) => (
                <div
                  key={`${esp.label}-${i}`}
                  className="flex shrink-0 items-center gap-3 rounded-2xl border border-border bg-card px-6 py-4 shadow-sm transition-colors hover:border-primary/40"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <esp.icon className="h-5 w-5" />
                  </span>
                  <span className="whitespace-nowrap text-sm font-semibold">{esp.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- BENEFICIOS ---------------- */}
        <section id="beneficios" className="py-20">
          <Container size="xl">
            <Reveal>
              <SectionHeading eyebrow="Beneficios" title="Por qué elegir IntiFix" gradient />
            </Reveal>
            <RevealGroup className="mt-12 grid gap-6 md:grid-cols-3">
              {BENEFICIOS.map((b) => (
                <RevealItem
                  key={b.title}
                  className="group relative overflow-hidden rounded-2xl border border-border bg-card p-7 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10"
                >
                  <span className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-primary to-rose-400 transition-transform duration-300 group-hover:scale-x-100" />
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
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
              <SectionHeading eyebrow="Testimonios" title="Historias que reparan confianza" gradient />
            </Reveal>
            <RevealGroup className="mt-12 grid gap-6 md:grid-cols-3">
              {TESTIMONIOS.map((t) => (
                <RevealItem
                  key={t.name}
                  className="relative flex flex-col rounded-2xl border border-border bg-card p-7 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10"
                >
                  <span className="pointer-events-none absolute right-5 top-3 font-heading text-6xl leading-none text-primary/10">”</span>
                  <div className="flex gap-1 text-primary">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="mt-4 flex-1 text-sm text-muted-foreground">“{t.quote}”</p>
                  <div className="mt-5 flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {t.name.slice(0, 1)}
                    </span>
                    <div>
                      <div className="text-sm font-semibold">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.role}</div>
                    </div>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>
          </Container>
        </section>

        {/* ---------------- NOSOTROS ---------------- */}
        <section id="nosotros" className="py-20">
          <Container size="xl">
            <Reveal>
              <SectionHeading
                eyebrow="Nosotros"
                title="Lo que nos mueve"
                subtitle="Conectamos hogares con técnicos de confianza, con tecnología que de verdad ayuda."
                gradient
              />
            </Reveal>
            <RevealGroup className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {VALORES.map((v) => (
                <RevealItem
                  key={v.title}
                  className="group relative overflow-hidden rounded-2xl border border-border bg-card p-7 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10"
                >
                  <span className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-primary to-rose-400 transition-transform duration-300 group-hover:scale-x-100" />
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                    <v.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{v.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{v.text}</p>
                </RevealItem>
              ))}
            </RevealGroup>
          </Container>
        </section>

        {/* ---------------- PRECIOS ---------------- */}
        <section id="precios" className="bg-muted/40 py-20">
          <Container size="lg">
            <Reveal>
              <SectionHeading
                eyebrow="Precios"
                title="Sin mensualidades, sin sorpresas"
                subtitle="Gratis para clientes. Los técnicos solo pagan comisión cuando cobran un servicio."
                gradient
              />
            </Reveal>
            <RevealGroup className="mt-12 grid gap-6 md:grid-cols-2">
              {PLANES.map((p) => (
                <RevealItem
                  key={p.audiencia}
                  className={cn(
                    "relative rounded-3xl p-8 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-primary/10",
                    p.destacado
                      ? "border-2 border-primary bg-primary/5"
                      : "border border-border bg-card",
                  )}
                >
                  {p.destacado && (
                    <span className="absolute -top-3 left-8 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
                      Más popular
                    </span>
                  )}
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <p.icon className="h-6 w-6" />
                  </div>
                  <p className="mt-5 text-sm font-medium text-muted-foreground">{p.audiencia}</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="font-heading text-4xl font-bold tracking-tight">{p.precio}</span>
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
          </Container>
        </section>

        {/* ---------------- CTA (tarjeta vino animada) ---------------- */}
        <section className="py-20">
          <Container size="lg">
            <Reveal>
              <div className="animate-wine-pan relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-[#5e1822] to-[#3a0f17] p-10 text-center text-white shadow-2xl shadow-primary/25 sm:p-16">
                <div className="animate-float-slow pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
                <div
                  className="animate-float-slow pointer-events-none absolute -left-10 bottom-0 h-56 w-56 rounded-full bg-rose-300/15 blur-3xl"
                  style={{ animationDelay: "1.5s" }}
                />
                <h2 className="relative font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                  ¿Algo que reparar hoy?
                </h2>
                <p className="relative mx-auto mt-3 max-w-xl text-white/80">
                  Crea tu cuenta gratis y recibe recomendaciones de técnicos en minutos.
                </p>
                <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Button size="lg" className="bg-white text-primary hover:bg-white/90" asChild>
                    <Link to={paths.register}>
                      Empezar ahora
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                    asChild
                  >
                    <Link to={paths.login}>Iniciar sesión</Link>
                  </Button>
                </div>
              </div>
            </Reveal>
          </Container>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
