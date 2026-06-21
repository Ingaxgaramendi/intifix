import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Briefcase, Calendar, MapPin, AlertCircle, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Modal } from "@/components/ui/modal"
import { Pagination } from "@/components/shared/pagination"
import { EstadoBadge } from "@/components/services/estado-badge"
import { formatCurrency, formatDateTime } from "@/lib/format"
import { servicioDireccion, type Servicio } from "@/types/service"
import { useCrearCotizacion, useServiciosDisponibles } from "./use-technician"

const MODALIDAD_LABEL: Record<string, string> = {
  EN_CASA_CLIENTE: "En domicilio",
  EN_TALLER_TECNICO: "En taller",
}

const cotizarSchema = z.object({
  precio: z.coerce.number().min(0.01, "Ingresa un precio válido").max(999999.99),
  tiempoEstimado: z.string().min(1, "Requerido").max(100, "Máximo 100 caracteres"),
  comentario: z.string().max(1000, "Máximo 1000 caracteres").optional(),
})
type CotizarIn = z.input<typeof cotizarSchema>
type CotizarOut = z.output<typeof cotizarSchema>

function CotizarModal({ servicio, onClose }: { servicio: Servicio | null; onClose: () => void }) {
  const crear = useCrearCotizacion()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CotizarIn, unknown, CotizarOut>({ resolver: zodResolver(cotizarSchema) })

  const close = () => {
    reset()
    onClose()
  }

  const onSubmit = (v: CotizarOut) => {
    if (!servicio) return
    crear.mutate(
      {
        idServicio: servicio.idServicio,
        precio: v.precio,
        tiempoEstimado: v.tiempoEstimado,
        comentario: v.comentario,
      },
      { onSuccess: close },
    )
  }

  return (
    <Modal
      open={!!servicio}
      onClose={close}
      title="Enviar cotización"
      description={servicio?.titulo}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="precio">Precio (S/)</Label>
            <Input
              id="precio"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              className="h-11"
              aria-invalid={!!errors.precio}
              {...register("precio")}
            />
            {errors.precio && <p className="text-sm text-destructive">{errors.precio.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="tiempoEstimado">Tiempo estimado</Label>
            <Input
              id="tiempoEstimado"
              placeholder="Ej. 2 horas"
              className="h-11"
              aria-invalid={!!errors.tiempoEstimado}
              {...register("tiempoEstimado")}
            />
            {errors.tiempoEstimado && (
              <p className="text-sm text-destructive">{errors.tiempoEstimado.message}</p>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="comentario">Comentario (opcional)</Label>
          <Textarea
            id="comentario"
            rows={3}
            placeholder="Detalla tu propuesta, repuestos incluidos, garantía, etc."
            {...register("comentario")}
          />
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={close}>
            Cancelar
          </Button>
          <Button type="submit" disabled={crear.isPending}>
            {crear.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Enviar cotización
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function ServicioCard({ s, onCotizar }: { s: Servicio; onCotizar: () => void }) {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold leading-snug">{s.titulo}</h3>
        <EstadoBadge estado={s.estado} />
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{s.descripcion}</p>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        {s.modalidad && (
          <span className="font-medium text-foreground">
            {MODALIDAD_LABEL[s.modalidad] ?? s.modalidad}
          </span>
        )}
        {s.fechaProgramada && (
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {formatDateTime(s.fechaProgramada)}
          </span>
        )}
        {servicioDireccion(s) && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {servicioDireccion(s)}
          </span>
        )}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <div>
          <p className="text-xs text-muted-foreground">Presupuesto máx.</p>
          <p className="font-semibold">{formatCurrency(s.presupuestoMaximo)}</p>
        </div>
        <Button size="sm" onClick={onCotizar}>
          Cotizar
        </Button>
      </div>
    </div>
  )
}

export function ServiciosDisponiblesPage() {
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<Servicio | null>(null)
  const { data, isLoading, isError, refetch } = useServiciosDisponibles(page)
  const servicios = data?.content ?? []

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Servicios disponibles</h1>
        <p className="mt-1 text-muted-foreground">Encuentra trabajos y envía tus cotizaciones.</p>
      </header>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-16 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="mt-4 font-medium">No pudimos cargar los servicios</p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      ) : servicios.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Briefcase className="h-7 w-7" />
          </span>
          <p className="mt-4 font-medium">No hay servicios disponibles ahora</p>
          <p className="mt-1 text-sm text-muted-foreground">Vuelve pronto: se publican nuevos a diario.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {servicios.map((s) => (
            <ServicioCard key={s.idServicio} s={s} onCotizar={() => setSelected(s)} />
          ))}
        </div>
      )}

      {data && (
        <Pagination
          page={data.number}
          totalPages={data.totalPages}
          first={data.first}
          last={data.last}
          onPageChange={setPage}
        />
      )}

      <CotizarModal servicio={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
