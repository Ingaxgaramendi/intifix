import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Wrench, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Container } from "@/components/layout/container"
import { Button } from "@/components/shared/button"
import { paths } from "@/routes/paths"

const NAV_LINKS = [
  { label: "Cómo funciona", href: "#como-funciona" },
  { label: "Especialidades", href: "#especialidades" },
  { label: "Beneficios", href: "#beneficios" },
  { label: "Nosotros", href: "#nosotros" },
  { label: "Precios", href: "#precios" },
]

function Logo({ scrolled }: { scrolled: boolean }) {
  return (
    <a
      href="#top"
      className={cn(
        "flex items-center gap-2 font-semibold text-lg tracking-tight transition-colors",
        scrolled ? "text-foreground" : "text-white",
      )}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm ring-1 ring-white/20">
        <Wrench className="h-5 w-5" />
      </span>
      <span>
        INTI<span className={scrolled ? "text-primary" : "text-rose-300"}>FIX</span>
      </span>
    </a>
  )
}

/**
 * Premium sticky navigation. Transparent over the hero, then condenses into a
 * blurred bar with a hairline border once the user scrolls — the same pattern
 * Airbnb and Stripe use to keep the hero clean while staying reachable.
 */
export function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Lock body scroll while the mobile sheet is open.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [mobileOpen])

  // Links are light over the (dark) video hero, and revert to muted text once
  // the bar condenses into its blurred light background on scroll.
  const navLinkClass = cn(
    "rounded-full px-4 py-2 text-sm font-medium transition-colors",
    scrolled
      ? "text-muted-foreground hover:bg-accent hover:text-foreground"
      : "text-white/85 hover:bg-white/10 hover:text-white",
  )

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-border/70 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <Container size="xl">
        <nav className="flex h-16 items-center justify-between">
          <Logo scrolled={scrolled} />

          <div className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className={navLinkClass}>
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <Button
              variant="ghost"
              size="sm"
              className={cn(!scrolled && "text-white hover:bg-white/10 hover:text-white")}
              asChild
            >
              <Link to={paths.login}>Iniciar sesión</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to={paths.register}>Solicitar servicio</Link>
            </Button>
          </div>

          <button
            type="button"
            aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setMobileOpen((v) => !v)}
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center rounded-xl transition-colors md:hidden",
              scrolled ? "text-foreground hover:bg-accent" : "text-white hover:bg-white/10",
            )}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>
      </Container>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-border/70 bg-background/95 backdrop-blur-md md:hidden"
          >
            <Container size="xl" className="flex flex-col gap-1 py-4">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-2 flex flex-col gap-2">
                <Button variant="outline" className="w-full" asChild>
                  <Link to={paths.login} onClick={() => setMobileOpen(false)}>
                    Iniciar sesión
                  </Link>
                </Button>
                <Button className="w-full" asChild>
                  <Link to={paths.register} onClick={() => setMobileOpen(false)}>
                    Solicitar servicio
                  </Link>
                </Button>
              </div>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
