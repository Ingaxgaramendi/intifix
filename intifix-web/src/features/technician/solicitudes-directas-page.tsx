import { useState } from "react"
import {
  UserCheck,
  Calendar,
  Briefcase,
  Check,
  X,
  Loader2,
  MapPin,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Pagination } from "@/components/shared/pagination"
import { EstadoBadge } from "@/components/services/estado-badge"
import { UserAvatar } from "@/components/shared/user-avatar"
import { formatDateTime, formatCurrency } from "@/lib/format"
import { useClienteMini, useEspecialidadesMap } from "@/features/services/use-services"
import type { Servicio } from "@/types/service"
import { useSolicitudesDirectas, useAceptarDirecta, useRechazarDirecta } from "./use-technician"

const MODALIDAD_LABEL: Record<string, string> = {
  EN_CASA_CLIENTE: "En domicilio",
  EN_TALLER_TECNICO: "En taller",
}

function SolicitudCard({ s }: { s: Servicio }) {
  const [confirmar, setConfirmar] = useState<"aceptar" | "rechazar" | null>(null)
  const aceptar = useAceptarDirecta()
  const rechazar = useRechazarDirecta()
  const cliente = useClienteMini(s.idCliente)
  const especialidades = useEspecialidadesMap()

  const nombreCliente = s.nombreCliente ?? cliente.data?.nombre ?? "Cliente"
  const especialidad = s.idEspecialidad ? especialidades.get(s.idEspecialidad) : undefined
  const busy = aceptar.isPending || rechazar.isPending

  return (
    <div className="rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-lg dark:hover:border-primary/50 dark:hover:shadow-xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <UserAvatar nombre={nombreCliente} fotoUrl={cliente.data?.foto ?? undefined} size={40} />
          <div>
            <p className="font-semibold">{nombreCliente}</p>
            {especialidad && (
              <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {especialidad}
              </span>
            )}
          </div>
        </div>
        <EstadoBadge estado={s.estado} />
      </div>

      {/* Servicio info */}
      <div className="mt-4">
        <p className="font-medium">{s.titulo}</p>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{s.descripcion}</p>
      </div>

      {/* Chips */}
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
        {s.modalidad && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {MODALIDAD_LABEL[s.modalidad] ?? s.modalidad}
          </span>
        )}
        {s.fechaProgramada && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {formatDateTime(s.fechaProgramada)}
          </span>
        )}
        {s.presupuestoMaximo != null && (
          <span className="flex items-center gap-1">
            <Briefcase className="h-3.5 w-3.5" />
            Presupuesto hasta {formatCurrency(s.presupuestoMaximo)}
          </span>
        )}
      </div>

      {/* Fotos preview */}
      {s.fotos && s.fotos.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {s.fotos.slice(0, 4).map((url) => (
            <img
              key={url}
              src={url}
              alt="Foto del servicio"
              className="h-16 w-16 shrink-0 rounded-xl object-cover"
            />
          ))}
        </div>
      )}

      {/* Confirm dialog inline */}
      {confirmar ? (
        <div className="mt-4 rounded-xl border border-border bg-muted/30 p-4">
          <div className="flex items-start gap-2 text-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <p>
              {confirmar === "aceptar"
                ? "¿Aceptar esta solicitud directa? Se creará una asignación automática y el servicio quedará a tu cargo."
                : "¿Rechazar esta solicitud? El servicio se publicará en el marketplace para todos los técnicos."}
            </p>
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              variant={confirmar === "aceptar" ? "default" : "destructive"}
              disabled={busy}
              onClick={() => {
                if (confirmar === "aceptar") aceptar.mutate(s.idServicio)
                else rechazar.mutate(s.idServicio)
                setConfirmar(null)
              }}
            >
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {confirmar === "aceptar" ? "Sí, aceptar" : "Sí, rechazar"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmar(null)}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex gap-2">
          <Button
            size="sm"
            className="flex-1"
            disabled={busy}
            onClick={() => setConfirmar("aceptar")}
          >
            <Check className="h-4 w-4" />
            Aceptar
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            disabled={busy}
            onClick={() => setConfirmar("rechazar")}
          >
            <X className="h-4 w-4" />
            Rechazar
          </Button>
        </div>
      )}
    </div>
  )
}

export function SolicitudesDirectasPage() {
  const [page, setPage] = useState(0)
  const { data, isLoading } = useSolicitudesDirectas(page)

  const items = Array.isArray(data) ? data : (data?.content ?? [])
  const totalPages = Array.isArray(data) ? 1 : (data?.totalPages ?? 1)
  const isFirst = Array.isArray(data) ? true : (data?.first ?? true)
  const isLast = Array.isArray(data) ? true : (data?.last ?? true)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <UserCheck className="h-7 w-7 text-primary" />
          Solicitudes directas
        </h1>
        <p className="mt-1 text-muted-foreground">
          Clientes que te eligieron a ti específicamente. Acéptalas o recházalas.
        </p>
      </header>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-52 rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <UserCheck className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 font-medium text-muted-foreground">No tienes solicitudes directas</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Cuando un cliente te contacte directamente aparecerá aquí.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {items.map((s) => (
              <SolicitudCard key={s.idServicio} s={s} />
            ))}
          </div>
          {totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} first={isFirst} last={isLast} onPageChange={setPage} />
          )}
        </>
      )}
    </div>
  )
}
