import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Briefcase, Calendar, MapPin, AlertCircle, Send, Wrench, CheckCircle2, Search, SlidersHorizontal, Maximize2, Zap, CalendarRange, Clock } from "lucide-react"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Modal } from "@/components/ui/modal"
import { ImageLightbox } from "@/components/ui/image-lightbox"
import { PerfilLink } from "@/components/shared/perfil-link"
import { UserAvatar } from "@/components/shared/user-avatar"
import { cn } from "@/lib/utils"
import { paths } from "@/routes/paths"
import { Pagination } from "@/components/shared/pagination"
import { EstadoBadge } from "@/components/services/estado-badge"
import { formatCurrency, formatDateTime } from "@/lib/format"
import { servicioDireccion, type Servicio, type TipoFecha } from "@/types/service"
import { computeBreakdown, grossFromNet } from "@/types/payment"
import { StaticMap } from "@/components/map/static-map"
import { useClienteMini, useEspecialidadesMap, useUbicacion } from "@/features/services/use-services"
import { useCrearCotizacion, useServiciosCotizadosIds, useServiciosDisponibles } from "./use-technician"

const MODALIDAD_LABEL: Record<string, string> = {
  EN_CASA_CLIENTE: "En domicilio",
  EN_TALLER_TECNICO: "En taller",
}


/** Tiempo mínimo permitido para una cotización, en minutos. */
const TIEMPO_MIN_MINUTOS = 30

function makeCotizarSchema(tipoFecha?: TipoFecha) {
  return z
    .object({
      precio: z.coerce.number().min(0.01, "Ingresa un precio válido").max(999999.99),
      tiempoValor: z.coerce
        .number()
        .int("Solo números enteros")
        .min(1, "Requerido")
        .max(999, "Valor demasiado alto"),
      tiempoUnidad: z.enum(["MINUTOS", "HORAS"]),
      comentario: z.string().max(1000, "Máximo 1000 caracteres").optional(),
      fechaPropuesta: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (tiempoEnMinutos(data.tiempoValor, data.tiempoUnidad) < TIEMPO_MIN_MINUTOS) {
        ctx.addIssue({
          path: ["tiempoValor"],
          code: z.ZodIssueCode.custom,
          message: "El tiempo mínimo es 30 minutos",
        })
      }
      if ((tipoFecha === "URGENTE" || tipoFecha === "RANGO") && !data.fechaPropuesta) {
        ctx.addIssue({
          path: ["fechaPropuesta"],
          code: z.ZodIssueCode.custom,
          message:
            tipoFecha === "URGENTE"
              ? "Debes proponer una hora (hoy o mañana)"
              : "Debes proponer una fecha dentro del rango",
        })
      }
    })
}

const _base = makeCotizarSchema()
type CotizarIn = z.input<typeof _base>
type CotizarOut = z.output<typeof _base>

/** "YYYY-MM-DDTHH:MM" in local time — value for datetime-local inputs. */
function toLocalDTStr(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

/** Convierte valor + unidad a minutos totales (para validar el mínimo). */
function tiempoEnMinutos(valor: number, unidad: "MINUTOS" | "HORAS"): number {
  return unidad === "HORAS" ? valor * 60 : valor
}

/** Construye el texto que espera el backend, p.ej. "2 horas", "45 minutos". */
function formatTiempoEstimado(valor: number, unidad: "MINUTOS" | "HORAS"): string {
  if (unidad === "HORAS") return `${valor} ${valor === 1 ? "hora" : "horas"}`
  return `${valor} ${valor === 1 ? "minuto" : "minutos"}`
}

function TipoFechaBadge({ tipo }: { tipo?: TipoFecha | string }) {
  if (tipo === "URGENTE") {
    return (
      <span className="inline-flex animate-pulse items-center gap-1 rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-bold text-red-500 ring-1 ring-red-500/30">
        <Zap className="h-3 w-3" /> Urgente
      </span>
    )
  }
  if (tipo === "RANGO") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-600 ring-1 ring-amber-500/30 dark:text-amber-400">
        <CalendarRange className="h-3 w-3" /> Rango de fechas
      </span>
    )
  }
  if (tipo === "EXACTA") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
        <Clock className="h-3 w-3" /> Fecha exacta
      </span>
    )
  }
  return null
}

/** Galería: foto grande seleccionable + tira de miniaturas. */
function Galeria({ fotos, titulo }: { fotos: string[]; titulo: string }) {
  const [activa, setActiva] = useState(0)
  const [verLightbox, setVerLightbox] = useState(false)
  if (!fotos.length) return null
  const idx = Math.min(activa, fotos.length - 1)
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setVerLightbox(true)}
        aria-label="Ver imagen en pantalla completa"
        className="group relative block aspect-video w-full overflow-hidden rounded-xl bg-muted"
      >
        <img src={fotos[idx]} alt={titulo} className="h-full w-full object-cover" />
        <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-lg bg-foreground/70 px-2 py-1 text-xs font-medium text-background opacity-0 transition group-hover:opacity-100">
          <Maximize2 className="h-3.5 w-3.5" /> Ampliar
        </span>
      </button>
      {verLightbox && (
        <ImageLightbox
          fotos={fotos}
          index={idx}
          alt={titulo}
          onIndexChange={setActiva}
          onClose={() => setVerLightbox(false)}
        />
      )}
      {fotos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {fotos.map((url, i) => (
            <button
              type="button"
              key={url}
              onClick={() => setActiva(i)}
              className={cn(
                "h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition",
                i === idx ? "border-primary" : "border-transparent opacity-70 hover:opacity-100",
              )}
            >
              <img src={url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/** Detalle del servicio (galería + info) con el formulario de cotización embebido. */
function ServicioDetalleModal({
  servicio,
  yaCotizado,
  especialidad,
  onClose,
}: {
  servicio: Servicio | null
  yaCotizado: boolean
  especialidad?: string
  onClose: () => void
}) {
  const crear = useCrearCotizacion()
  const navigate = useNavigate()
  const schema = useMemo(() => makeCotizarSchema(servicio?.tipoFecha), [servicio?.tipoFecha])
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CotizarIn, unknown, CotizarOut>({
    resolver: zodResolver(schema),
    defaultValues: { tiempoUnidad: "HORAS" },
  })

  // Modo inverso: el técnico escribe lo que quiere RECIBIR; calculamos el precio
  // al cliente (gross-up) para que tras la comisión le quede exactamente eso.
  const netoDeseado = Number(watch("precio")) || 0
  const precioCliente = grossFromNet(netoDeseado)
  const desglose = computeBreakdown(precioCliente)

  const close = () => {
    reset()
    onClose()
  }

  // Min/max for the proposed-date picker, computed from the service mode.
  let minFecha: string | undefined
  let maxFecha: string | undefined
  if (servicio?.tipoFecha === "URGENTE") {
    minFecha = toLocalDTStr(new Date())
    const mañana = new Date()
    mañana.setDate(mañana.getDate() + 1)
    mañana.setHours(23, 59, 0, 0)
    maxFecha = toLocalDTStr(mañana)
  } else if (servicio?.tipoFecha === "RANGO") {
    if (servicio.fechaInicioRango) minFecha = toLocalDTStr(new Date(servicio.fechaInicioRango))
    if (servicio.fechaFinRango) maxFecha = toLocalDTStr(new Date(servicio.fechaFinRango))
  }

  const onSubmit = (v: CotizarOut) => {
    if (!servicio) return
    crear.mutate(
      {
        idServicio: servicio.idServicio,
        // Enviamos el precio al cliente (gross); el técnico recibe su neto íntegro.
        precio: grossFromNet(v.precio),
        tiempoEstimado: formatTiempoEstimado(v.tiempoValor, v.tiempoUnidad),
        comentario: v.comentario,
        // ISO UTC string; browser parses datetime-local as local time → toISOString() is UTC.
        ...(v.fechaPropuesta ? { fechaPropuesta: new Date(v.fechaPropuesta).toISOString() } : {}),
      },
      { onSuccess: close },
    )
  }

  // Solo los servicios a domicilio tienen ubicación; la traemos por idUbicacion.
  const esDomicilio = servicio?.modalidad === "EN_CASA_CLIENTE"
  const ubic = useUbicacion(esDomicilio ? servicio?.idUbicacion : undefined)
  const direccion = ubic.data?.direccionTexto ?? (servicio ? servicioDireccion(servicio) : undefined)

  return (
    <Modal open={!!servicio} onClose={close} title="Detalle del servicio" description={servicio?.titulo} size="3xl">
      {servicio && (
        <div className="max-h-[78vh] space-y-5 overflow-y-auto pr-1">
          <Galeria fotos={servicio.fotos ?? []} titulo={servicio.titulo} />

          <div className="flex flex-wrap items-center gap-2">
            <EstadoBadge estado={servicio.estado} />
            <TipoFechaBadge tipo={servicio.tipoFecha} />
            {especialidad && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                <Wrench className="h-3 w-3" />
                {especialidad}
              </span>
            )}
          </div>

          {(servicio.nombreCliente || servicio.idCliente) && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 p-3">
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Solicitado por</span>
                <ClienteInfo
                  idCliente={servicio.idCliente}
                  idServicio={servicio.idServicio}
                  nombreFallback={servicio.nombreCliente}
                  size={36}
                />
              </div>
              {servicio.idCliente && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    navigate(paths.tecnico.clientePerfil(servicio.idCliente!), {
                      state: { idServicio: servicio.idServicio },
                    })
                  }
                >
                  Ver perfil del cliente
                </Button>
              )}
            </div>
          )}

          <p className="whitespace-pre-line text-sm text-muted-foreground">{servicio.descripcion}</p>

          <div className="grid grid-cols-2 gap-3 rounded-xl border border-border p-4 text-sm">
            {servicio.modalidad && (
              <div>
                <p className="text-xs text-muted-foreground">Modalidad</p>
                <p className="font-medium">{MODALIDAD_LABEL[servicio.modalidad] ?? servicio.modalidad}</p>
              </div>
            )}
            {servicio.tipoFecha === "URGENTE" && (
              <div>
                <p className="text-xs text-muted-foreground">Cuándo</p>
                <p className="inline-flex items-center gap-1 font-medium text-red-500">
                  <Zap className="h-3.5 w-3.5" /> Lo antes posible
                </p>
              </div>
            )}
            {servicio.tipoFecha === "RANGO" && servicio.fechaInicioRango && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Ventana disponible</p>
                <p className="inline-flex items-center gap-1 font-medium">
                  <CalendarRange className="h-3.5 w-3.5 text-amber-500" />
                  {formatDateTime(servicio.fechaInicioRango)} – {formatDateTime(servicio.fechaFinRango)}
                </p>
              </div>
            )}
            {(!servicio.tipoFecha || servicio.tipoFecha === "EXACTA") && servicio.fechaProgramada && (
              <div>
                <p className="text-xs text-muted-foreground">Fecha programada</p>
                <p className="inline-flex items-center gap-1 font-medium">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDateTime(servicio.fechaProgramada)}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Presupuesto máx.</p>
              <p className="font-medium">{formatCurrency(servicio.presupuestoMaximo)}</p>
            </div>
            {direccion && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Dirección</p>
                <p className="inline-flex items-center gap-1 font-medium">
                  <MapPin className="h-3.5 w-3.5" />
                  {direccion}
                </p>
              </div>
            )}
          </div>

          {/* Mapa de la ubicación del cliente (solo a domicilio) */}
          {esDomicilio && ubic.data?.latitud != null && ubic.data?.longitud != null && (
            <StaticMap lat={ubic.data.latitud} lng={ubic.data.longitud} height={180} />
          )}

          {yaCotizado ? (
            <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
              <CheckCircle2 className="h-5 w-5 text-success" />
              Ya enviaste una cotización para este servicio.
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 border-t border-border pt-5" noValidate>
              <p className="font-semibold">Enviar cotización</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="precio">Quiero recibir (S/)</Label>
                  <Input
                    id="precio"
                    type="number"
                    min={0}
                    step="0.01"
                    inputMode="decimal"
                    placeholder="Tu monto neto"
                    className="h-11"
                    aria-invalid={!!errors.precio}
                    {...register("precio")}
                  />
                  {errors.precio && <p className="text-sm text-destructive">{errors.precio.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tiempoValor">Tiempo estimado</Label>
                  <div className="flex gap-2">
                    <Input
                      id="tiempoValor"
                      type="number"
                      min={1}
                      step={1}
                      inputMode="numeric"
                      placeholder="Ej. 2"
                      className="h-11 flex-1"
                      aria-invalid={!!errors.tiempoValor}
                      {...register("tiempoValor")}
                    />
                    <Select
                      id="tiempoUnidad"
                      className="h-11 w-32 shrink-0"
                      aria-label="Unidad de tiempo"
                      {...register("tiempoUnidad")}
                    >
                      <option value="HORAS">Horas</option>
                      <option value="MINUTOS">Minutos</option>
                    </Select>
                  </div>
                  {errors.tiempoValor ? (
                    <p className="text-sm text-destructive">{errors.tiempoValor.message}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Mínimo 30 minutos.</p>
                  )}
                </div>
              </div>

              {/* Gross-up: lo que verá/pagará el cliente para que tú recibas tu neto. */}
              {netoDeseado > 0 && (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">El cliente pagará</span>
                    <span className="text-lg font-bold text-primary">{formatCurrency(precioCliente)}</span>
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>Comisión INTIFIX (1%)</span>
                      <span>{formatCurrency(desglose.comisionPlataforma + desglose.impuestoTotal)}</span>
                    </div>
                    <div className="flex items-center justify-between pl-3">
                      <span>— IGV (18%) sobre la comisión</span>
                      <span>{formatCurrency(desglose.impuestoTotal)}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-border pt-1 font-medium text-foreground">
                      <span>Tú recibes</span>
                      <span>{formatCurrency(desglose.montoNetoTecnico)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Fecha propuesta — solo para URGENTE y RANGO */}
              {(servicio.tipoFecha === "URGENTE" || servicio.tipoFecha === "RANGO") && (
                <div className="space-y-2">
                  <Label htmlFor="fechaPropuesta">
                    {servicio.tipoFecha === "URGENTE"
                      ? "¿Cuándo puedes atender? (hoy o mañana)"
                      : "Propón una fecha dentro del rango solicitado"}
                  </Label>
                  {servicio.tipoFecha === "RANGO" && servicio.fechaInicioRango && (
                    <p className="text-xs text-muted-foreground">
                      Rango del cliente:{" "}
                      {formatDateTime(servicio.fechaInicioRango)} – {formatDateTime(servicio.fechaFinRango)}
                    </p>
                  )}
                  <Input
                    id="fechaPropuesta"
                    type="datetime-local"
                    className="h-11"
                    min={minFecha}
                    max={maxFecha}
                    aria-invalid={!!errors.fechaPropuesta}
                    {...register("fechaPropuesta")}
                  />
                  {errors.fechaPropuesta && (
                    <p className="text-sm text-destructive">{errors.fechaPropuesta.message}</p>
                  )}
                </div>
              )}

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
          )}
        </div>
      )}
    </Modal>
  )
}

/** Foto + nombre del cliente que publicó el servicio (clickeable a su perfil). */
function ClienteInfo({
  idCliente,
  idServicio,
  nombreFallback,
  size = 28,
}: {
  idCliente?: string
  idServicio: string
  nombreFallback?: string
  size?: number
}) {
  const mini = useClienteMini(idCliente)
  const nombre = mini.data?.nombre ?? nombreFallback ?? "Cliente"
  const to = idCliente ? paths.tecnico.clientePerfil(idCliente) : undefined
  return (
    <PerfilLink to={to} state={{ idServicio }} className="inline-flex items-center gap-2">
      <UserAvatar nombre={nombre} fotoUrl={mini.data?.foto} size={size} />
      <span className="text-sm font-medium">{nombre}</span>
    </PerfilLink>
  )
}

function ServicioCard({
  s,
  especialidad,
  yaCotizado,
  onVer,
}: {
  s: Servicio
  especialidad?: string
  yaCotizado: boolean
  onVer: () => void
}) {
  const portada = s.fotos?.[0]
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onVer}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onVer()}
      className="flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg dark:hover:border-primary/50 dark:hover:shadow-xl"
    >
      {portada && (
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          <img src={portada} alt={s.titulo} className="h-full w-full object-cover" loading="lazy" />
          {(s.fotos?.length ?? 0) > 1 && (
            <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
              +{(s.fotos?.length ?? 0) - 1}
            </span>
          )}
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold leading-snug">{s.titulo}</h3>
        <EstadoBadge estado={s.estado} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <TipoFechaBadge tipo={s.tipoFecha} />
        {especialidad && (
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            <Wrench className="h-3 w-3" />
            {especialidad}
          </span>
        )}
      </div>
      {(s.idCliente || s.nombreCliente) && (
        <div className="mt-2" onClick={(e) => e.stopPropagation()}>
          <ClienteInfo idCliente={s.idCliente} idServicio={s.idServicio} nombreFallback={s.nombreCliente} size={26} />
        </div>
      )}
      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{s.descripcion}</p>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        {s.modalidad && (
          <span className="font-medium text-foreground">
            {MODALIDAD_LABEL[s.modalidad] ?? s.modalidad}
          </span>
        )}
        {s.tipoFecha === "URGENTE" && (
          <span className="inline-flex items-center gap-1 font-medium text-red-500">
            <Zap className="h-3.5 w-3.5" /> Lo antes posible
          </span>
        )}
        {s.tipoFecha !== "URGENTE" && s.tipoFecha === "RANGO" && s.fechaInicioRango && s.fechaFinRango && (
          <span className="inline-flex items-center gap-1">
            <CalendarRange className="h-3.5 w-3.5" />
            {formatDateTime(s.fechaInicioRango)} – {formatDateTime(s.fechaFinRango)}
          </span>
        )}
        {(!s.tipoFecha || s.tipoFecha === "EXACTA") && s.fechaProgramada && (
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
      <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
        <div>
          <p className="text-xs text-muted-foreground">Presupuesto máx.</p>
          <p className="font-semibold">{formatCurrency(s.presupuestoMaximo)}</p>
        </div>
        {yaCotizado ? (
          <Button size="sm" variant="outline" disabled>
            <CheckCircle2 className="h-4 w-4" />
            Cotizado
          </Button>
        ) : (
          <Button size="sm" onClick={(e) => { e.stopPropagation(); onVer() }}>
            Ver y cotizar
          </Button>
        )}
      </div>
      </div>
    </div>
  )
}

export function ServiciosDisponiblesPage() {
  const idTec = useAuthStore((s) => s.user?.idUsuario)
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<Servicio | null>(null)
  const { data, isLoading, isError, refetch } = useServiciosDisponibles(page)
  const especialidades = useEspecialidadesMap()
  const { data: cotizados } = useServiciosCotizadosIds(idTec)
  const servicios = data?.content ?? []

  const [q, setQ] = useState("")
  const [fModalidad, setFModalidad] = useState("")
  const [fEspecialidad, setFEspecialidad] = useState("")
  const hayFiltros = !!(q || fModalidad || fEspecialidad)

  const limpiar = () => {
    setQ("")
    setFModalidad("")
    setFEspecialidad("")
  }

  // Especialidades presentes en los servicios cargados (para el select).
  const espOptions = useMemo(() => {
    const seen = new Map<string, string>()
    servicios.forEach((s) => {
      if (s.idEspecialidad && !seen.has(s.idEspecialidad)) {
        seen.set(s.idEspecialidad, especialidades.get(s.idEspecialidad) ?? "Especialidad")
      }
    })
    return [...seen.entries()]
  }, [servicios, especialidades])

  // Filtrado en cliente sobre la página cargada (texto + modalidad + especialidad).
  const filtrados = useMemo(() => {
    const term = q.trim().toLowerCase()
    return servicios.filter((s) => {
      if (term) {
        const campos = [s.titulo, s.descripcion, s.nombreCliente]
        if (!campos.some((c) => c?.toLowerCase().includes(term))) return false
      }
      if (fModalidad && s.modalidad !== fModalidad) return false
      if (fEspecialidad && s.idEspecialidad !== fEspecialidad) return false
      return true
    })
  }, [servicios, q, fModalidad, fEspecialidad])

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Servicios disponibles</h1>
        <p className="mt-1 text-muted-foreground">Encuentra trabajos y envía tus cotizaciones.</p>
      </header>

      {/* Filtros de búsqueda */}
      {!isLoading && !isError && servicios.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por título, descripción o cliente…"
                className="h-11 pl-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 lg:flex">
              <Select
                value={fModalidad}
                onChange={(e) => setFModalidad(e.target.value)}
                className="h-11 lg:w-40"
                aria-label="Filtrar por modalidad"
              >
                <option value="">Modalidad</option>
                <option value="EN_CASA_CLIENTE">En domicilio</option>
                <option value="EN_TALLER_TECNICO">En taller</option>
              </Select>
              <Select
                value={fEspecialidad}
                onChange={(e) => setFEspecialidad(e.target.value)}
                className="h-11 lg:w-44"
                aria-label="Filtrar por especialidad"
                disabled={espOptions.length === 0}
              >
                <option value="">Especialidad</option>
                {espOptions.map(([id, nombre]) => (
                  <option key={id} value={id}>
                    {nombre}
                  </option>
                ))}
              </Select>
            </div>
            {hayFiltros && (
              <Button variant="ghost" className="shrink-0" onClick={limpiar}>
                Limpiar
              </Button>
            )}
          </div>
        </div>
      )}

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
      ) : filtrados.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <SlidersHorizontal className="h-7 w-7" />
          </span>
          <p className="mt-4 font-medium">Ningún servicio coincide con tu búsqueda</p>
          <p className="mt-1 text-sm text-muted-foreground">Prueba con otros filtros.</p>
          <Button variant="outline" className="mt-4" onClick={limpiar}>
            Limpiar filtros
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((s) => (
            <ServicioCard
              key={s.idServicio}
              s={s}
              especialidad={s.idEspecialidad ? especialidades.get(s.idEspecialidad) : undefined}
              yaCotizado={cotizados?.has(s.idServicio) ?? false}
              onVer={() => setSelected(s)}
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

      <ServicioDetalleModal
        servicio={selected}
        yaCotizado={selected ? (cotizados?.has(selected.idServicio) ?? false) : false}
        especialidad={selected?.idEspecialidad ? especialidades.get(selected.idEspecialidad) : undefined}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}
