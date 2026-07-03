import { Link } from "react-router-dom"
import { ArrowRight, ShieldCheck, Sparkles, HeartHandshake, Target, Wrench } from "lucide-react"
import { Container } from "@/components/layout/container"
import { Button } from "@/components/shared/button"
import { LandingNav } from "@/components/public/landing-nav"
import { CountUp } from "@/components/public/count-up"
import { SiteFooter } from "@/components/public/site-footer"
import { Reveal, RevealGroup, RevealItem } from "@/components/public/reveal"
import { paths } from "@/routes/paths"

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

const STATS = [
  { to: 5000, suffix: "+", label: "Técnicos registrados" },
  { to: 50000, suffix: "+", label: "Servicios realizados" },
  { to: 98, suffix: "%", label: "Clientes satisfechos" },
  { to: 15, suffix: " min", label: "Respuesta promedio" },
]

export function AboutPage() {
  return (
    <div id="top" className="flex min-h-screen flex-col bg-background text-foreground">
      <LandingNav />

      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-primary/10 via-background to-background" />
          <div className="animate-float-slow pointer-events-none absolute -left-20 top-24 -z-10 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
          <Container size="lg">
            <Reveal className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <Wrench className="h-4 w-4" />
                Sobre IntiFix
              </span>
              <h1 className="mt-6 font-heading text-4xl font-bold tracking-tight sm:text-5xl">
                Conectamos hogares con{" "}
                <span className="text-gradient-wine">técnicos de confianza</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
                Nacimos para resolver un problema simple pero universal: encontrar a alguien confiable
                que repare lo que se dañó, rápido y sin complicaciones. IntiFix es el puente entre
                clientes que necesitan ayuda y técnicos verificados que viven de su oficio.
              </p>
            </Reveal>
          </Container>
        </section>

        {/* STATS (banda vino animada) */}
        <section className="animate-wine-pan relative overflow-hidden bg-gradient-to-br from-primary via-[#5e1822] to-[#3a0f17] py-16 text-white">
          <div className="animate-float-slow pointer-events-none absolute -left-16 top-0 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <div
            className="animate-float-slow pointer-events-none absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-rose-300/10 blur-3xl"
            style={{ animationDelay: "2s" }}
          />
          <Container size="xl" className="relative">
            <RevealGroup className="grid grid-cols-2 gap-8 lg:grid-cols-4">
              {STATS.map((s) => (
                <RevealItem key={s.label} className="text-center">
                  <div className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">
                    <CountUp to={s.to} suffix={s.suffix} />
                  </div>
                  <div className="mt-2 text-sm font-medium text-white/75">{s.label}</div>
                </RevealItem>
              ))}
            </RevealGroup>
          </Container>
        </section>

        {/* VALORES */}
        <section className="py-20">
          <Container size="xl">
            <Reveal className="mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Nuestros valores
              </span>
              <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight text-gradient-wine sm:text-4xl">
                Lo que nos mueve
              </h2>
            </Reveal>
            <RevealGroup className="mt-12 grid gap-6 sm:grid-cols-2">
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

        {/* CTA (tarjeta vino) */}
        <section className="py-20">
          <Container size="lg">
            <Reveal>
              <div className="animate-wine-pan relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-[#5e1822] to-[#3a0f17] p-10 text-center text-white shadow-2xl shadow-primary/25 sm:p-16">
                <div className="animate-float-slow pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
                <h2 className="relative font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                  Únete a IntiFix
                </h2>
                <p className="relative mx-auto mt-3 max-w-xl text-white/80">
                  Ya seas cliente o técnico, hay un lugar para ti. Crea tu cuenta gratis.
                </p>
                <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Button size="lg" className="bg-white text-primary hover:bg-white/90" asChild>
                    <Link to={paths.register}>
                      Crear cuenta
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                    asChild
                  >
                    <Link to={paths.pricing}>Ver precios</Link>
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
