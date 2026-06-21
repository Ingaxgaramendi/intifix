import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, ClipboardList, AlertCircle, Play, CheckCircle2, Upload, Calendar } from "lucide-react"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Modal } from "@/components/ui/modal"
import { Pagination } from "@/components/shared/pagination"
import { EstadoBadge } from "@/components/services/estado-badge"
import { formatDateTime } from "@/lib/format"
import type { Asignacion } from "@/types/service"
import {
  useCrearEvidencia,
  useFinalizarAsignacion,
  useIniciarAsignacion,
  useMisAsignaciones,
} from "./use-technician"

const evidenciaSchema = z.object({
  urlArchivo: z.string().url("URL no válida").max(1000),
  nombreArchivo: z.string().min(1, "Requerido").max(255),
  tipoArchivo: z.enum(["IMAGEN", "VIDEO", "PDF"]),
  descripcion: z.string().max(500).optional(),
})
type EvidenciaForm = z.infer<typeof evidenciaSchema>

function EvidenciaModal({ asignacion, onClose }: { asignacion: Asignacion | null; onClose: () => void }) {
  const subidoPor = useAuthStore((s) => s.user?.idUsuario)
  const crear = useCrearEvidencia()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EvidenciaForm>({
    resolver: zodResolver(evidenciaSchema),
    defaultValues: { tipoArchivo: "IMAGEN" },
  })

  const close = () => {
    reset()
    onClose()
  }

  const onSubmit = (v: EvidenciaForm) => {
    if (!asignacion || !subidoPor) return
    crear.mutate(
      {
        idServicio: asignacion.idServicio,
        urlArchivo: v.urlArchivo,
        nombreArchivo: v.nombreArchivo,
        tipoArchivo: v.tipoArchivo,
        descripcion: v.descripcion,
        subidoPor,
      },
      { onSuccess: close },
    )
  }

  return (
    <Modal
      open={!!asignacion}
      onClose={close}
      title="Subir evidencia"
      description="Adjunta la URL del archivo ya alojado (foto, video o PDF)."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="space-y-2">
          <Label htmlFor="urlArchivo">URL del archivo</Label>
          <Input
            id="urlArchivo"
            placeholder="https://..."
            className="h-11"
            aria-invalid={!!errors.urlArchivo}
            {...register("urlArchivo")}
          />
          {errors.urlArchivo && <p className="text-sm text-destructive">{errors.urlArchivo.message}</p>}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="nombreArchivo">Nombre</Label>
            <Input
              id="nombreArchivo"
              placeholder="foto.jpg"
              className="h-11"
              aria-invalid={!!errors.nombreArchivo}
              {...register("nombreArchivo")}
            />
            {errors.nombreArchivo && (
              <p className="text-sm text-destructive">{errors.nombreArchivo.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="tipoArchivo">Tipo</Label>
            <Select id="tipoArchivo" {...register("tipoArchivo")}>
              <option value="IMAGEN">Imagen</option>
              <option value="VIDEO">Video</option>
              <option value="PDF">PDF</option>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="descripcion">Descripción (opcional)</Label>
          <Textarea id="descripcion" rows={3} {...register("descripcion")} />
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={close}>
            Cancelar
          </Button>
          <Button type="submit" disabled={crear.isPending}>
            {crear.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Subir
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function AsignacionCard({
  a,
  onIniciar,
  onFinalizar,
  onEvidencia,
  busy,
}: {
  a: Asignacion
  onIniciar: () => void
  onFinalizar: () => void
  onEvidencia: () => void
  busy: boolean
}) {
  const estado = String(a.estado ?? "").toUpperCase()
  const finalizada = ["FINALIZADO", "COMPLETADO", "CANCELADO"].includes(estado)
  const enProceso = ["EN_PROCESO", "EN_PROGRESO", "INICIADO"].includes(estado)

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">Servicio #{String(a.idServicio).slice(0, 8)}</p>
          {(a.fechaInicioEstimada || a.fechaFinEstimada) && (
            <p className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {formatDateTime(a.fechaInicioEstimada)}
              {a.fechaFinEstimada ? ` — ${formatDateTime(a.fechaFinEstimada)}` : ""}
            </p>
          )}
        </div>
        <EstadoBadge estado={a.estado} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
        {!enProceso && !finalizada && (
          <Button size="sm" onClick={onIniciar} disabled={busy}>
            <Play className="h-4 w-4" />
            Iniciar
          </Button>
        )}
        {enProceso && (
          <Button size="sm" onClick={onFinalizar} disabled={busy}>
            <CheckCircle2 className="h-4 w-4" />
            Finalizar
          </Button>
        )}
        {!finalizada && (
          <Button size="sm" variant="outline" onClick={onEvidencia}>
            <Upload className="h-4 w-4" />
            Subir evidencia
          </Button>
        )}
      </div>
    </div>
  )
}

export function MisAsignacionesPage() {
  const idTec = useAuthStore((s) => s.user?.idUsuario)
  const [page, setPage] = useState(0)
  const [evidenciaFor, setEvidenciaFor] = useState<Asignacion | null>(null)
  const { data, isLoading, isError, refetch } = useMisAsignaciones(idTec, page)
  const iniciar = useIniciarAsignacion()
  const finalizar = useFinalizarAsignacion()
  const items = data?.content ?? []
  const busy = iniciar.isPending || finalizar.isPending

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Mis asignaciones</h1>
        <p className="mt-1 text-muted-foreground">Inicia, finaliza y documenta tus trabajos.</p>
      </header>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-16 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="mt-4 font-medium">No pudimos cargar tus asignaciones</p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ClipboardList className="h-7 w-7" />
          </span>
          <p className="mt-4 font-medium">No tienes asignaciones todavía</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Cuando un cliente acepte tu cotización, aparecerá aquí.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => (
            <AsignacionCard
              key={a.idAsignacion}
              a={a}
              busy={busy}
              onIniciar={() => iniciar.mutate(a.idAsignacion)}
              onFinalizar={() => finalizar.mutate(a.idAsignacion)}
              onEvidencia={() => setEvidenciaFor(a)}
            />
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

      <EvidenciaModal asignacion={evidenciaFor} onClose={() => setEvidenciaFor(null)} />
    </div>
  )
}
