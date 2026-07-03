import { useRef, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { Loader2, MapPin, ImagePlus, X, UserCheck, Zap, Clock, CalendarRange } from "lucide-react"
import { uploadsApi } from "@/api/uploads"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { LocationPicker, type LatLng } from "@/components/map/location-picker"
import { AddressSearch } from "@/components/map/address-search"
import { reverseGeocode, type GeocodeResult } from "@/api/geocode"
import {
  departamentos,
  distritoCoords,
  distritos,
  matchUbigeo,
  provincias,
} from "@/data/ubigeo"
import { paths } from "@/routes/paths"
import { useCrearServicio, useSpecialties, useTecnicoNombre } from "./use-services"
import type { TipoFecha } from "@/types/service"

// ── Schema ─────────────────────────────────────────────────────────────────

const schema = z
  .object({
    idEspecialidad: z.string().min(1, "Elige una especialidad"),
    titulo: z.string().min(5, "Mínimo 5 caracteres").max(255, "Máximo 255 caracteres"),
    descripcion: z.string().min(10, "Mínimo 10 caracteres").max(2000, "Máximo 2000 caracteres"),
    modalidad: z.enum(["EN_CASA_CLIENTE", "EN_TALLER_TECNICO"]),
    presupuestoMaximo: z.coerce.number().min(0.01).max(999999.99).optional(),
    tipoFecha: z.enum(["URGENTE", "EXACTA", "RANGO"]),
    // EXACTA
    fechaExacta: z.string().optional(),
    // RANGO
    fechaInicioRango: z.string().optional(),
    fechaFinRango: z.string().optional(),
    // Ubicación — solo requerida para EN_CASA_CLIENTE
    departamento: z.string().max(100).optional(),
    provincia: z.string().max(100).optional(),
    distrito: z.string().max(100).optional(),
    direccionTexto: z.string().max(255).optional(),
    referencia: z.string().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    // Ubicación
    if (data.modalidad === "EN_CASA_CLIENTE") {
      const requeridos = ["departamento", "provincia", "distrito", "direccionTexto"] as const
      for (const campo of requeridos) {
        if (!data[campo]?.trim()) {
          ctx.addIssue({ path: [campo], code: z.ZodIssueCode.custom, message: "Requerido" })
        }
      }
    }
    // Fecha según modo
    if (data.tipoFecha === "EXACTA") {
      if (!data.fechaExacta?.trim()) {
        ctx.addIssue({ path: ["fechaExacta"], code: z.ZodIssueCode.custom, message: "Elige fecha y hora" })
      } else if (new Date(data.fechaExacta).getTime() <= Date.now()) {
        ctx.addIssue({ path: ["fechaExacta"], code: z.ZodIssueCode.custom, message: "Debe ser una fecha futura" })
      }
    }
    if (data.tipoFecha === "RANGO") {
      if (!data.fechaInicioRango?.trim()) {
        ctx.addIssue({ path: ["fechaInicioRango"], code: z.ZodIssueCode.custom, message: "Elige la fecha de inicio" })
      } else if (new Date(data.fechaInicioRango).getTime() <= Date.now()) {
        ctx.addIssue({ path: ["fechaInicioRango"], code: z.ZodIssueCode.custom, message: "Debe ser una fecha futura" })
      }
      if (!data.fechaFinRango?.trim()) {
        ctx.addIssue({ path: ["fechaFinRango"], code: z.ZodIssueCode.custom, message: "Elige la fecha de fin" })
      } else if (data.fechaInicioRango) {
        const inicio = new Date(data.fechaInicioRango)
        const fin = new Date(data.fechaFinRango!)
        if (fin <= inicio) {
          ctx.addIssue({ path: ["fechaFinRango"], code: z.ZodIssueCode.custom, message: "Debe ser posterior al inicio" })
        } else {
          const diffDias = Math.floor((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24))
          if (diffDias > 5) {
            ctx.addIssue({ path: ["fechaFinRango"], code: z.ZodIssueCode.custom, message: "El rango no puede superar 5 días" })
          }
        }
      }
    }
  })

type FormIn = z.input<typeof schema>
type FormOut = z.output<typeof schema>

// ── Mode cards ──────────────────────────────────────────────────────────────

const FECHA_MODES: { value: TipoFecha; icon: React.ElementType; label: string; desc: string; color: string }[] = [
  {
    value: "URGENTE",
    icon: Zap,
    label: "Lo antes posible",
    desc: "El sistema encuentra el técnico disponible más cercano.",
    color: "text-red-500",
  },
  {
    value: "EXACTA",
    icon: Clock,
    label: "Fecha y hora exacta",
    desc: "Elige el día y la hora exacta en que lo necesitas.",
    color: "text-primary",
  },
  {
    value: "RANGO",
    icon: CalendarRange,
    label: "Rango de fechas",
    desc: "Da un rango de hasta 5 días y el técnico elige cuándo.",
    color: "text-amber-500",
  },
]

// ── Component ───────────────────────────────────────────────────────────────

export function PedirServicioPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const idTecnicoDirecto = searchParams.get("idTecnico") ?? undefined
  const crear = useCrearServicio()
  const specialties = useSpecialties()
  const { data: nombreTecnico } = useTecnicoNombre(idTecnicoDirecto)
  const [location, setLocation] = useState<LatLng | null>(null)
  const [locError, setLocError] = useState(false)
  const [fotos, setFotos] = useState<string[]>([])
  const [fotosError, setFotosError] = useState(false)
  const [subiendoFotos, setSubiendoFotos] = useState(false)

  const MAX_FOTOS = 5
  const FOTO_MAX_BYTES = 5 * 1024 * 1024

  const onFotosSeleccionadas = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const seleccion = Array.from(e.target.files ?? [])
    e.target.value = ""
    if (!seleccion.length) return

    const espacio = MAX_FOTOS - fotos.length
    if (espacio <= 0) { toast.error(`Máximo ${MAX_FOTOS} fotos.`); return }
    const aSubir = seleccion.slice(0, espacio)
    if (seleccion.length > espacio) toast.error(`Solo puedes agregar ${espacio} foto(s) más.`)

    setSubiendoFotos(true)
    try {
      for (const file of aSubir) {
        if (!file.type.startsWith("image/")) { toast.error(`"${file.name}" no es una imagen.`); continue }
        if (file.size > FOTO_MAX_BYTES) { toast.error(`"${file.name}" supera los 5 MB.`); continue }
        const url = await uploadsApi.file(file)
        setFotos((prev) => [...prev, url])
        setFotosError(false)
      }
    } catch {
      toast.error("No se pudo subir una foto")
    } finally {
      setSubiendoFotos(false)
    }
  }

  const quitarFoto = (url: string) => setFotos((prev) => prev.filter((u) => u !== url))

  const {
    register,
    control,
    watch,
    setValue,
    getValues,
    handleSubmit,
    formState: { errors },
  } = useForm<FormIn, unknown, FormOut>({
    resolver: zodResolver(schema),
    defaultValues: {
      modalidad: "EN_CASA_CLIENTE",
      tipoFecha: "EXACTA",
      departamento: "",
      provincia: "",
      distrito: "",
    },
  })

  const depSel = watch("departamento")
  const provSel = watch("provincia")
  const esEnTaller = watch("modalidad") === "EN_TALLER_TECNICO"
  const tipoFecha = watch("tipoFecha") as TipoFecha
  const provOptions = depSel ? provincias(depSel) : []
  const distOptions = depSel && provSel ? distritos(depSel, provSel) : []

  const onDistritoChange = (dep: string, prov: string, dist: string) => {
    const c = dist ? distritoCoords(dep, prov, dist) : null
    if (c) { setLocation(c); setLocError(false) }
  }

  const aplicarUbigeo = (r: GeocodeResult) => {
    const m =
      matchUbigeo(r.departamento, r.provincia, r.distrito) ??
      matchUbigeo(r.departamento, undefined, r.distrito) ??
      matchUbigeo(undefined, undefined, r.distrito)
    if (m) {
      setValue("departamento", m.departamento, { shouldValidate: true })
      setValue("provincia", m.provincia, { shouldValidate: true })
      setValue("distrito", m.distrito, { shouldValidate: true })
    }
  }

  const onAddress = (r: GeocodeResult) => {
    setLocation({ lat: r.lat, lng: r.lng })
    setLocError(false)
    setValue("direccionTexto", r.direccion, { shouldValidate: true })
    aplicarUbigeo(r)
  }

  const revCtrl = useRef<AbortController | null>(null)
  const [geoLoading, setGeoLoading] = useState(false)
  const onMapPick = async (p: LatLng) => {
    setLocation(p)
    setLocError(false)
    revCtrl.current?.abort()
    const ctrl = new AbortController()
    revCtrl.current = ctrl
    setGeoLoading(true)
    try {
      const r = await reverseGeocode(p.lat, p.lng, ctrl.signal)
      if (r) {
        aplicarUbigeo(r)
        if (!getValues("direccionTexto")?.trim()) {
          setValue("direccionTexto", r.direccion, { shouldValidate: true })
        }
      }
    } catch {
      /* abortado o sin conexión */
    } finally {
      if (revCtrl.current === ctrl) setGeoLoading(false)
    }
  }

  const onSubmit = (v: FormOut) => {
    const enTaller = v.modalidad === "EN_TALLER_TECNICO"
    let invalido = false
    if (!enTaller && !location) { setLocError(true); invalido = true }
    if (fotos.length < 1) { setFotosError(true); invalido = true }
    if (invalido) return

    const fechaFields =
      v.tipoFecha === "EXACTA"
        ? { fechaProgramada: new Date(v.fechaExacta!).toISOString() }
        : v.tipoFecha === "RANGO"
          ? {
              fechaInicioRango: new Date(v.fechaInicioRango!).toISOString(),
              fechaFinRango: new Date(v.fechaFinRango!).toISOString(),
            }
          : {}

    const servicio = {
      idEspecialidad: v.idEspecialidad,
      titulo: v.titulo,
      descripcion: v.descripcion,
      modalidad: v.modalidad,
      presupuestoMaximo: v.presupuestoMaximo,
      tipoFecha: v.tipoFecha,
      fotos,
      ...fechaFields,
      ...(idTecnicoDirecto
        ? { tipoSolicitud: "DIRECTA" as const, idTecnicoDirecto }
        : { tipoSolicitud: "PUBLICA" as const }),
    }

    const ubicacion =
      enTaller || !location
        ? undefined
        : {
            departamento: v.departamento ?? "",
            provincia: v.provincia ?? "",
            distrito: v.distrito ?? "",
            direccionTexto: v.direccionTexto ?? "",
            referencia: v.referencia,
            latitud: Number(location.lat.toFixed(7)),
            longitud: Number(location.lng.toFixed(7)),
          }

    crear.mutate(
      { ubicacion, servicio },
      { onSuccess: (s) => navigate(paths.cliente.servicioDetalle(s.idServicio)) },
    )
  }

  const fieldError = (msg?: string) =>
    msg ? <p className="text-sm text-destructive">{msg}</p> : null

  return (
    <div className="mx-auto max-w-3xl [--input:oklch(0.78_0.010_260)] dark:[--input:oklch(0.32_0.010_260)]">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Pedir un servicio</h1>
        <p className="mt-1 text-muted-foreground">
          Describe tu problema. Técnicos verificados te enviarán cotizaciones.
        </p>
        {idTecnicoDirecto && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
            <UserCheck className="h-4 w-4 shrink-0 text-primary" />
            <span>
              Solicitud directa para{" "}
              <strong>{nombreTecnico ?? "el técnico seleccionado"}</strong>.
              Solo ese técnico verá esta solicitud y podrá aceptarla o rechazarla.
            </span>
          </div>
        )}
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
        {/* --- Detalle --- */}
        <section className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              placeholder="Ej. Mi laptop no enciende"
              className="h-11"
              aria-invalid={!!errors.titulo}
              {...register("titulo")}
            />
            {fieldError(errors.titulo?.message)}
          </div>

          <div className="space-y-2">
            <Label htmlFor="idEspecialidad">Especialidad</Label>
            <Select
              id="idEspecialidad"
              defaultValue=""
              disabled={specialties.isLoading}
              aria-invalid={!!errors.idEspecialidad}
              {...register("idEspecialidad")}
            >
              <option value="" disabled>
                {specialties.isLoading ? "Cargando…" : "¿Qué tipo de técnico necesitas?"}
              </option>
              {specialties.data?.map((e) => (
                <option key={e.idEspecialidad} value={e.idEspecialidad}>
                  {e.nombre}
                </option>
              ))}
            </Select>
            {fieldError(errors.idEspecialidad?.message)}
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              rows={5}
              placeholder="Cuéntanos qué falla, desde cuándo, marca/modelo, etc."
              aria-invalid={!!errors.descripcion}
              {...register("descripcion")}
            />
            {fieldError(errors.descripcion?.message)}
          </div>

          {/* Fotos del servicio (1 a 5) */}
          <div className="space-y-2">
            <Label>Fotos del problema</Label>
            <p className="text-sm text-muted-foreground">
              Sube de 1 a 5 fotos (JPG/PNG, máx. 5 MB). Ayudan al técnico a cotizar mejor.
            </p>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              {fotos.map((url) => (
                <div key={url} className="group relative aspect-square overflow-hidden rounded-xl border border-border">
                  <img src={url} alt="Foto del servicio" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => quitarFoto(url)}
                    aria-label="Quitar foto"
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {fotos.length < MAX_FOTOS && (
                <label
                  className={cn(
                    "flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary",
                    subiendoFotos && "pointer-events-none opacity-60",
                  )}
                >
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    className="hidden"
                    disabled={subiendoFotos}
                    onChange={onFotosSeleccionadas}
                  />
                  {subiendoFotos ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <ImagePlus className="h-5 w-5" />
                  )}
                  <span className="text-xs font-medium">{subiendoFotos ? "Subiendo…" : "Agregar"}</span>
                </label>
              )}
            </div>
            {fotosError && (
              <p className="text-sm text-destructive">Agrega al menos una foto.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="modalidad">Modalidad</Label>
            <Select id="modalidad" {...register("modalidad")}>
              <option value="EN_CASA_CLIENTE">En mi domicilio</option>
              <option value="EN_TALLER_TECNICO">En taller del técnico</option>
            </Select>
          </div>
        </section>

        {/* --- Cuándo lo necesitas --- */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">¿Cuándo lo necesitas?</h2>
            <p className="text-sm text-muted-foreground">Elige el tipo de disponibilidad que mejor te conviene.</p>
          </div>

          {/* Mode selector */}
          <Controller
            control={control}
            name="tipoFecha"
            render={({ field }) => (
              <div className="grid gap-3 sm:grid-cols-3">
                {FECHA_MODES.map((m) => {
                  const Icon = m.icon
                  const selected = field.value === m.value
                  return (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => field.onChange(m.value)}
                      className={cn(
                        "flex flex-col gap-2 rounded-2xl border p-4 text-left transition-all",
                        selected
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border bg-card hover:border-primary/40 hover:bg-muted/40",
                      )}
                    >
                      <Icon className={cn("h-5 w-5", selected ? m.color : "text-muted-foreground")} />
                      <span className={cn("text-sm font-semibold", selected ? "text-foreground" : "text-muted-foreground")}>
                        {m.label}
                      </span>
                      <span className="text-xs text-muted-foreground leading-snug">{m.desc}</span>
                    </button>
                  )
                })}
              </div>
            )}
          />

          {/* URGENTE: info banner */}
          {tipoFecha === "URGENTE" && (
            <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm">
              <Zap className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <p className="text-muted-foreground">
                El sistema notificará a los técnicos disponibles más cercanos a tu ubicación de inmediato.
                El primer técnico que acepte quedará asignado.
              </p>
            </div>
          )}

          {/* EXACTA: datetime-local */}
          {tipoFecha === "EXACTA" && (
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fechaExacta">Fecha y hora</Label>
                <Input
                  id="fechaExacta"
                  type="datetime-local"
                  className="h-11"
                  aria-invalid={!!errors.fechaExacta}
                  {...register("fechaExacta")}
                />
                {fieldError(errors.fechaExacta?.message)}
              </div>
              <div className="space-y-2">
                <Label htmlFor="presupuestoMaximo">Presupuesto máximo (opcional)</Label>
                <Input
                  id="presupuestoMaximo"
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  placeholder="S/ 250"
                  className="h-11"
                  {...register("presupuestoMaximo")}
                />
                {fieldError(errors.presupuestoMaximo?.message)}
              </div>
            </div>
          )}

          {/* RANGO: two date pickers */}
          {tipoFecha === "RANGO" && (
            <div className="space-y-4">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fechaInicioRango">Desde</Label>
                  <Input
                    id="fechaInicioRango"
                    type="date"
                    className="h-11"
                    aria-invalid={!!errors.fechaInicioRango}
                    {...register("fechaInicioRango")}
                  />
                  {fieldError(errors.fechaInicioRango?.message)}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fechaFinRango">Hasta</Label>
                  <Input
                    id="fechaFinRango"
                    type="date"
                    className="h-11"
                    aria-invalid={!!errors.fechaFinRango}
                    {...register("fechaFinRango")}
                  />
                  {fieldError(errors.fechaFinRango?.message)}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Máximo 5 días de rango. El técnico elegirá el día y la hora exacta dentro de tu ventana.
              </p>
              <div className="space-y-2">
                <Label htmlFor="presupuestoMaximoRango">Presupuesto máximo (opcional)</Label>
                <Input
                  id="presupuestoMaximoRango"
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  placeholder="S/ 250"
                  className="h-11"
                  {...register("presupuestoMaximo")}
                />
                {fieldError(errors.presupuestoMaximo?.message)}
              </div>
            </div>
          )}

          {/* URGENTE: presupuesto */}
          {tipoFecha === "URGENTE" && (
            <div className="space-y-2">
              <Label htmlFor="presupuestoUrgente">Presupuesto máximo (opcional)</Label>
              <Input
                id="presupuestoUrgente"
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                placeholder="S/ 250"
                className="h-11"
                {...register("presupuestoMaximo")}
              />
              {fieldError(errors.presupuestoMaximo?.message)}
            </div>
          )}
        </section>

        {/* --- Ubicación (solo a domicilio) --- */}
        {esEnTaller ? (
          <section className="flex items-start gap-3 rounded-2xl border border-border bg-muted/40 p-4">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p className="text-sm text-muted-foreground">
              Elegiste <span className="font-medium text-foreground">en taller del técnico</span>: el
              servicio se realiza en el taller, así que no necesitas registrar tu ubicación.
            </p>
          </section>
        ) : (
          <section className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Ubicación</h2>
              <p className="text-sm text-muted-foreground">¿Dónde se realizará el servicio?</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="departamento">Departamento</Label>
                <Controller
                  control={control}
                  name="departamento"
                  render={({ field }) => (
                    <Select
                      id="departamento"
                      aria-invalid={!!errors.departamento}
                      value={field.value ?? ""}
                      onChange={(e) => {
                        field.onChange(e)
                        setValue("provincia", "")
                        setValue("distrito", "")
                      }}
                    >
                      <option value="">Selecciona…</option>
                      {departamentos.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </Select>
                  )}
                />
                {fieldError(errors.departamento?.message)}
              </div>
              <div className="space-y-2">
                <Label htmlFor="provincia">Provincia</Label>
                <Controller
                  control={control}
                  name="provincia"
                  render={({ field }) => (
                    <Select
                      id="provincia"
                      aria-invalid={!!errors.provincia}
                      disabled={!depSel}
                      value={field.value ?? ""}
                      onChange={(e) => {
                        field.onChange(e)
                        setValue("distrito", "")
                      }}
                    >
                      <option value="">{depSel ? "Selecciona…" : "Elige departamento"}</option>
                      {provOptions.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </Select>
                  )}
                />
                {fieldError(errors.provincia?.message)}
              </div>
              <div className="space-y-2">
                <Label htmlFor="distrito">Distrito</Label>
                <Controller
                  control={control}
                  name="distrito"
                  render={({ field }) => (
                    <Select
                      id="distrito"
                      aria-invalid={!!errors.distrito}
                      disabled={!provSel}
                      value={field.value ?? ""}
                      onChange={(e) => {
                        field.onChange(e)
                        onDistritoChange(depSel ?? "", provSel ?? "", e.target.value)
                      }}
                    >
                      <option value="">{provSel ? "Selecciona…" : "Elige provincia"}</option>
                      {distOptions.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </Select>
                  )}
                />
                {fieldError(errors.distrito?.message)}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="direccionTexto">Dirección</Label>
              <Input id="direccionTexto" placeholder="Av. Pardo 123" className="h-11" aria-invalid={!!errors.direccionTexto} {...register("direccionTexto")} />
              {fieldError(errors.direccionTexto?.message)}
            </div>

            <div className="space-y-2">
              <Label htmlFor="referencia">Referencia (opcional)</Label>
              <Input id="referencia" placeholder="Frente al parque" className="h-11" {...register("referencia")} />
            </div>

            <div className="space-y-2">
              <Label>Buscar y marcar en el mapa</Label>
              <p className="text-sm text-muted-foreground">
                Busca una dirección o lugar y elígelo; luego ajusta el pin si hace falta.
              </p>
              <AddressSearch onSelect={onAddress} />
              <LocationPicker className="mt-1" value={location} onChange={onMapPick} />
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                {geoLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <MapPin className="h-4 w-4 text-primary" />
                )}
                {geoLoading
                  ? "Detectando zona…"
                  : location
                    ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
                    : "Sin ubicación seleccionada"}
              </p>
              {locError && <p className="text-sm text-destructive">Marca un punto en el mapa</p>}
            </div>
          </section>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
          <Button type="submit" className="px-6" disabled={crear.isPending}>
            {crear.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Publicar servicio
          </Button>
        </div>
      </form>
    </div>
  )
}
