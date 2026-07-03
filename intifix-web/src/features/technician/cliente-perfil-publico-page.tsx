import { useState, type ReactNode } from "react"
import { useNavigate, useParams, useLocation } from "react-router-dom"
import {
  ArrowLeft,
  MapPin,
  CalendarDays,
  ClipboardList,
  ShieldCheck,
  MessageSquare,
  Loader2,
  UserRound,
  Flag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { StaticMap } from "@/components/map/static-map"
import { Reveal, RevealGroup, RevealItem } from "@/components/public/reveal"
import { CountUp } from "@/components/public/count-up"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/format"
import { paths } from "@/routes/paths"
import { useAuthStore } from "@/stores/auth-store"
import { useClientePerfilPublico } from "@/features/profile/use-cliente-profile"
import { useAbrirChatServicio } from "@/features/chat/use-chat"
import { DenunciarModal } from "@/components/shared/denunciar-modal"

const STAT_TONES = {
  primary: "bg-primary/10 text-primary",
  info: "bg-info/10 text-info",
  warning: "bg-warning/15 text-warning",
  success: "bg-success/15 text-success",
} as const

function Stat({
  icon,
  label,
  value,
  tone = "primary",
}: {
  icon: ReactNode
  label: string
  value: ReactNode
  tone?: keyof typeof STAT_TONES
}) {
  return (
    <div className="group flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
      <span
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110",
          STAT_TONES[tone],
        )}
      >
        {icon}
      </span>
      <span className="text-lg font-bold tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

/** Avatar con anillo cónico vino→dorado que gira lento, igual que el del técnico. */
function Avatar({ nombre, fotoUrl, size = 104 }: { nombre: string; fotoUrl?: string; size?: number }) {
  const inner = fotoUrl ? (
    <img
      src={fotoUrl}
      alt={nombre}
      style={{ width: size, height: size }}
      className="block rounded-full border-4 border-card object-cover"
    />
  ) : (
    <span
      style={{ width: size, height: size }}
      className="flex items-center justify-center rounded-full border-4 border-card bg-primary/10 text-2xl font-bold text-primary"
    >
      {nombre.slice(0, 2).toUpperCase()}
    </span>
  )
  return (
    <span className="relative inline-block shrink-0 rounded-full p-[3px] shadow-xl">
      <span className="animate-spin-slow absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,var(--primary),var(--warning),var(--primary))]" />
      <span className="relative block rounded-full">{inner}</span>
    </span>
  )
}

export function ClientePerfilPublicoPage() {
  const { idCliente: paramId } = useParams<{ idCliente: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const myId = useAuthStore((s) => s.user?.idUsuario)
  const [denunciarOpen, setDenunciarOpen] = useState(false)
  // Sin :idCliente en la URL = el cliente ve SU propio perfil público.
  const idCliente = paramId ?? myId
  const esPropio = !!idCliente && idCliente === myId
  // El técnico llega desde un servicio: ese idServicio habilita el chat y la denuncia.
  const idServicio = (location.state as { idServicio?: string } | null)?.idServicio
  const abrirChat = useAbrirChatServicio()

  const { data: c, isLoading } = useClientePerfilPublico(idCliente)

  if (isLoading || !c) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-40 w-full rounded-3xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    )
  }

  const nombre = c.nombresCompletos ?? "Cliente"
  const zona = [c.distrito, c.provincia].filter(Boolean).join(", ")
  const tieneCoords = c.latitud != null && c.longitud != null

  const onChat = () => {
    if (!idServicio) return
    abrirChat.mutate(idServicio, {
      onSuccess: (idConversacion) => navigate(paths.shared.chatConversacion(idConversacion)),
    })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-8">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Volver
      </button>

      {/* Identidad */}
      <Reveal from="up" className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        {/* Portada vino con textura, sheen en movimiento y blobs flotantes. */}
        <div className="relative h-28 overflow-hidden bg-gradient-to-br from-primary via-primary/85 to-primary/50 sm:h-32">
          <div className="cover-dots absolute inset-0 opacity-70" />
          <div className="cover-sheen animate-wine-pan absolute inset-0" />
          <div className="animate-float-slow absolute -right-10 -top-12 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
          <div
            className="animate-float-slow absolute -bottom-20 left-8 h-44 w-44 rounded-full bg-white/10 blur-3xl"
            style={{ animationDelay: "2.5s" }}
          />
          <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            <ShieldCheck className="h-3.5 w-3.5" /> Verificado
          </span>
        </div>
        <div className="px-6 pb-6">
          <div className="-mt-14 w-fit">
            <Avatar nombre={nombre} fotoUrl={c.fotoPerfilUrl} />
          </div>
          <div className="mt-4">
            <h1 className="text-2xl font-bold tracking-tight">{nombre}</h1>
            {zona && (
              <p className="mt-1.5 inline-flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> {zona}
              </p>
            )}
          </div>
        </div>
      </Reveal>

      {/* Stats */}
      <RevealGroup className="grid grid-cols-2 gap-3">
        <RevealItem>
          <Stat
            icon={<ClipboardList className="h-5 w-5" />}
            label="Servicios publicados"
            tone="primary"
            value={<CountUp to={c.totalServicios ?? 0} />}
          />
        </RevealItem>
        <RevealItem>
          <Stat
            icon={<CalendarDays className="h-5 w-5" />}
            label="Miembro desde"
            tone="info"
            value={c.creadoEn ? formatDate(c.creadoEn) : "—"}
          />
        </RevealItem>
      </RevealGroup>

      {/* Zona aproximada (sin dirección exacta) */}
      <Reveal from="up">
        <div className="rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg dark:hover:border-primary/50 dark:hover:shadow-xl">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MapPin className="h-4 w-4" />
            </span>
            Zona aproximada
          </p>
          {tieneCoords ? (
            <>
              <p className="mb-3 text-sm font-medium">{zona || "Ubicación registrada"}</p>
              <StaticMap
                lat={c.latitud as number}
                lng={c.longitud as number}
                zoom={13}
                height={200}
                className="overflow-hidden rounded-2xl"
              />
              <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                Por privacidad solo se muestra la zona; la dirección exacta se comparte al aceptar el servicio.
              </p>
            </>
          ) : (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <UserRound className="h-4 w-4" /> Este cliente aún no registró su ubicación.
            </p>
          )}
        </div>
      </Reveal>

      {/* CTA */}
      {idServicio && (
        <div className="space-y-2">
          <Button className="w-full" onClick={onChat} disabled={abrirChat.isPending}>
            {abrirChat.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
            Solicitar chat
          </Button>
          <Button
            variant="ghost"
            className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setDenunciarOpen(true)}
          >
            <Flag className="h-4 w-4" />
            Denunciar cliente
          </Button>
        </div>
      )}

      {esPropio && (
        <Button variant="outline" className="w-full" onClick={() => navigate(paths.cliente.perfil)}>
          Editar mi perfil
        </Button>
      )}

      {idServicio && idCliente && (
        <DenunciarModal
          open={denunciarOpen}
          onClose={() => setDenunciarOpen(false)}
          idServicio={idServicio}
          idReportado={idCliente}
          nombreReportado={nombre}
        />
      )}
    </div>
  )
}
