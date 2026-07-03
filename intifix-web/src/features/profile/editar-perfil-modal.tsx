import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  User,
  MapPin,
  Clock,
  Loader2,
  Plus,
  Power,
  Trash2,
  CalendarOff,
} from "lucide-react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { LocationPicker, type LatLng } from "@/components/map/location-picker"
import { AddressSearch } from "@/components/map/address-search"
import { reverseGeocode, type GeocodeResult } from "@/api/geocode"
import { ubicacionesApi, type CreateUbicacionRequest } from "@/api/ubicaciones"
import { cn } from "@/lib/utils"
import { formatDateTime } from "@/lib/format"
import { DIAS_SEMANA, type Horario, type Tecnico } from "@/types/technician"
import {
  useUpdateTecnico,
  useUpdateLocation,
} from "./use-tecnico-profile"
import {
  useActualizarHorario,
  useCrearExcepcion,
  useCrearHorario,
  useEliminarExcepcion,
  useEliminarHorario,
  useExcepciones,
  useHorarios,
} from "@/features/technician/use-agenda"

type Tab = "datos" | "ubicacion" | "horarios"

const TABS: { id: Tab; label: string; icon: typeof User }[] = [
  { id: "datos", label: "Datos personales", icon: User },
  { id: "ubicacion", label: "Ubicación", icon: MapPin },
  { id: "horarios", label: "Horarios", icon: Clock },
]

/* ───────────────────── Datos personales ───────────────────── */

type TipoDoc = "DNI" | "RUC"

const makeDatosSchema = (tipo: TipoDoc) =>
  z.object({
    nombresCompletos: z.string().min(2, "Mínimo 2 caracteres").max(100, "Máximo 100 caracteres"),
    dniRuc: tipo === "DNI"
      ? z.string().regex(/^\d{8}$/, "El DNI debe tener exactamente 8 dígitos").or(z.literal("")).optional()
      : z.string().regex(/^\d{11}$/, "El RUC debe tener exactamente 11 dígitos").or(z.literal("")).optional(),
    telefonoContacto: z
      .string()
      .regex(/^[0-9+()\-\s]{6,15}$/, "Teléfono inválido (6-15 caracteres)")
      .or(z.literal(""))
      .optional(),
    experienciaAnios: z.coerce
      .number({ invalid_type_error: "Solo números" })
      .min(0, "Mínimo 0")
      .max(50, "Máximo 50 años")
      .optional(),
    tarifaBase: z.coerce
      .number({ invalid_type_error: "Solo números" })
      .min(1, "Mínimo S/ 1")
      .max(9999, "Máximo S/ 9999")
      .optional(),
    descripcion: z.string().max(600, "Máximo 600 caracteres").optional(),
  })

type DatosIn = z.input<ReturnType<typeof makeDatosSchema>>
type DatosOut = z.output<ReturnType<typeof makeDatosSchema>>

function DatosTab({ idUsuario, tecnico, telefonoRegistro, onDone }: {
  idUsuario: string
  tecnico?: Tecnico
  telefonoRegistro?: string
  onDone: () => void
}) {
  const update = useUpdateTecnico(idUsuario)

  const existingDni = tecnico?.dniRuc ?? ""
  const [tipoDoc, setTipoDoc] = useState<TipoDoc>(
    existingDni.length === 11 ? "RUC" : "DNI",
  )

  const form = useForm<DatosIn, unknown, DatosOut>({
    resolver: zodResolver(makeDatosSchema(tipoDoc)),
    values: {
      nombresCompletos: tecnico?.nombresCompletos ?? "",
      dniRuc: existingDni,
      telefonoContacto: tecnico?.telefonoContacto ?? telefonoRegistro ?? "",
      experienciaAnios: tecnico?.experienciaAnios,
      tarifaBase: tecnico?.tarifaBase,
      descripcion: tecnico?.descripcion ?? "",
    },
  })

  const handleTipoDoc = (t: TipoDoc) => {
    setTipoDoc(t)
    form.setValue("dniRuc", "")
    form.clearErrors("dniRuc")
  }

  const nombreVal = form.watch("nombresCompletos") ?? ""
  const descVal = form.watch("descripcion") ?? ""

  const onSubmit = (v: DatosOut) =>
    update.mutate(
      {
        nombresCompletos: v.nombresCompletos,
        dniRuc: v.dniRuc || undefined,
        telefonoContacto: v.telefonoContacto || undefined,
        experienciaAnios: v.experienciaAnios,
        tarifaBase: v.tarifaBase,
        descripcion: v.descripcion ?? "",
      },
      { onSuccess: onDone },
    )

  const err = form.formState.errors

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {/* Nombre */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="ep-nombre">Nombre completo</Label>
          <span className={cn("text-xs tabular-nums", nombreVal.length > 90 ? "text-destructive" : "text-muted-foreground")}>
            {nombreVal.length}/100
          </span>
        </div>
        <Input
          id="ep-nombre"
          className="h-11"
          maxLength={100}
          placeholder="Juan Pérez Quispe"
          {...form.register("nombresCompletos")}
        />
        {err.nombresCompletos && <p className="text-sm text-destructive">{err.nombresCompletos.message}</p>}
      </div>

      {/* DNI / RUC + Teléfono */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          {/* Selector de tipo de documento */}
          <div className="flex items-center justify-between">
            <Label htmlFor="ep-dniRuc">Número de documento</Label>
            <div className="flex rounded-lg border border-border bg-muted/50 p-0.5">
              {(["DNI", "RUC"] as TipoDoc[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleTipoDoc(t)}
                  className={cn(
                    "rounded-md px-3 py-1 text-xs font-semibold transition-all",
                    tipoDoc === t
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <Input
            id="ep-dniRuc"
            inputMode="numeric"
            maxLength={tipoDoc === "DNI" ? 8 : 11}
            placeholder={tipoDoc === "DNI" ? "12345678" : "20501234567"}
            className="h-11"
            {...form.register("dniRuc")}
          />
          <p className="text-xs text-muted-foreground">
            {tipoDoc === "DNI" ? "8 dígitos exactos" : "11 dígitos exactos (empieza en 20 o 10)"}
          </p>
          {err.dniRuc && <p className="text-sm text-destructive">{err.dniRuc.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ep-tel">Teléfono de contacto</Label>
          <Input
            id="ep-tel"
            inputMode="tel"
            maxLength={15}
            placeholder="987 654 321"
            className="h-11"
            {...form.register("telefonoContacto")}
          />
          <p className="text-xs text-muted-foreground">Máx. 15 caracteres · Solo dígitos y +-()</p>
          {err.telefonoContacto && <p className="text-sm text-destructive">{err.telefonoContacto.message}</p>}
        </div>
      </div>

      {/* Experiencia + Tarifa */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="ep-exp">Años de experiencia</Label>
          <Input
            id="ep-exp"
            type="number"
            min={0}
            max={50}
            className="h-11"
            placeholder="0"
            {...form.register("experienciaAnios")}
          />
          {err.experienciaAnios && <p className="text-sm text-destructive">{err.experienciaAnios.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ep-tarifa">Tarifa base (S/)</Label>
          <Input
            id="ep-tarifa"
            type="number"
            min={1}
            max={9999}
            step="0.50"
            className="h-11"
            placeholder="50.00"
            {...form.register("tarifaBase")}
          />
          {err.tarifaBase && <p className="text-sm text-destructive">{err.tarifaBase.message}</p>}
        </div>
      </div>

      {/* Descripción */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="ep-desc">Acerca de mí</Label>
          <span className={cn("text-xs tabular-nums", descVal.length > 550 ? "text-destructive" : "text-muted-foreground")}>
            {descVal.length}/600
          </span>
        </div>
        <Textarea
          id="ep-desc"
          rows={4}
          maxLength={600}
          placeholder="Tu experiencia, qué ofreces, garantías, marcas con las que trabajas…"
          {...form.register("descripcion")}
        />
        {err.descripcion && <p className="text-sm text-destructive">{err.descripcion.message}</p>}
      </div>

      <div className="flex justify-end border-t border-border pt-4">
        <Button type="submit" className="px-8" disabled={update.isPending}>
          {update.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Guardar datos
        </Button>
      </div>
    </form>
  )
}

/* ───────────────────── Ubicación ───────────────────── */

const ubicacionSchema = z.object({
  departamento: z.string().min(1, "Requerido").max(100),
  provincia: z.string().min(1, "Requerido").max(100),
  distrito: z.string().min(1, "Requerido").max(100),
  direccionTexto: z.string().min(1, "Requerido").max(255),
  referencia: z.string().max(200).optional(),
})
type UbicacionForm = z.infer<typeof ubicacionSchema>

function UbicacionTab({ idUsuario, tecnico, onDone }: {
  idUsuario: string
  tecnico?: Tecnico
  onDone: () => void
}) {
  const updateLocation = useUpdateLocation(idUsuario)
  const [location, setLocation] = useState<LatLng | null>(null)
  const [locError, setLocError] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)
  const revCtrl = useRef<AbortController | null>(null)
  const ub = tecnico?.ubicacion

  const form = useForm<UbicacionForm>({
    resolver: zodResolver(ubicacionSchema),
    values: {
      departamento: ub?.departamento ?? "",
      provincia: ub?.provincia ?? "",
      distrito: ub?.distrito ?? "",
      direccionTexto: ub?.direccionTexto ?? "",
      referencia: ub?.referencia ?? "",
    },
  })

  useEffect(() => {
    if (ub?.latitud != null && ub?.longitud != null && !location)
      setLocation({ lat: ub.latitud, lng: ub.longitud })
  }, [ub, location])

  const aplicarDatos = (r: GeocodeResult) => {
    if (r.departamento) form.setValue("departamento", r.departamento, { shouldValidate: true })
    if (r.provincia) form.setValue("provincia", r.provincia, { shouldValidate: true })
    if (r.distrito) form.setValue("distrito", r.distrito, { shouldValidate: true })
    if (r.direccion) form.setValue("direccionTexto", r.direccion, { shouldValidate: true })
  }

  const onAddress = (r: GeocodeResult) => {
    setLocation({ lat: r.lat, lng: r.lng })
    setLocError(false)
    aplicarDatos(r)
  }

  const onMapPick = async (p: LatLng) => {
    setLocation(p)
    setLocError(false)
    revCtrl.current?.abort()
    const ctrl = new AbortController()
    revCtrl.current = ctrl
    setGeoLoading(true)
    try {
      const r = await reverseGeocode(p.lat, p.lng, ctrl.signal)
      if (r) aplicarDatos(r)
    } catch { /* abortado */ }
    finally { if (revCtrl.current === ctrl) setGeoLoading(false) }
  }

  const onSubmit = (v: UbicacionForm) => {
    if (!location) { setLocError(true); return }
    const body: CreateUbicacionRequest = {
      departamento: v.departamento,
      provincia: v.provincia,
      distrito: v.distrito,
      direccionTexto: v.direccionTexto,
      referencia: v.referencia,
      latitud: Number(location.lat.toFixed(7)),
      longitud: Number(location.lng.toFixed(7)),
    }
    updateLocation.mutate(body, { onSuccess: onDone })
  }

  const err = form.formState.errors

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="space-y-1.5">
        <Label>Buscar dirección</Label>
        <AddressSearch onSelect={onAddress} placeholder="Busca tu calle, zona o referencia…" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="ep-dep">Departamento</Label>
          <Input id="ep-dep" maxLength={100} className="h-11" {...form.register("departamento")} />
          {err.departamento && <p className="text-sm text-destructive">{err.departamento.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ep-prov">Provincia</Label>
          <Input id="ep-prov" maxLength={100} className="h-11" {...form.register("provincia")} />
          {err.provincia && <p className="text-sm text-destructive">{err.provincia.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ep-dist">Distrito</Label>
          <Input id="ep-dist" maxLength={100} className="h-11" {...form.register("distrito")} />
          {err.distrito && <p className="text-sm text-destructive">{err.distrito.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ep-dir">Dirección</Label>
        <Input id="ep-dir" maxLength={255} placeholder="Av. Pardo 123" className="h-11" {...form.register("direccionTexto")} />
        {err.direccionTexto && <p className="text-sm text-destructive">{err.direccionTexto.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ep-ref">Referencia (opcional)</Label>
        <Input id="ep-ref" maxLength={200} placeholder="Frente al parque" className="h-11" {...form.register("referencia")} />
      </div>

      <div className="space-y-2">
        <Label>Punto en el mapa</Label>
        <LocationPicker value={location} onChange={onMapPick} />
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          {geoLoading
            ? <><Loader2 className="h-4 w-4 animate-spin text-primary" /> Detectando dirección…</>
            : location
              ? <><MapPin className="h-4 w-4 text-primary" /> {location.lat.toFixed(5)}, {location.lng.toFixed(5)}</>
              : <><MapPin className="h-4 w-4" /> Toca el mapa para marcar tu punto</>}
        </p>
        {locError && <p className="text-sm text-destructive">Marca un punto en el mapa</p>}
      </div>

      <div className="flex justify-end border-t border-border pt-4">
        <Button type="submit" className="px-8" disabled={updateLocation.isPending}>
          {updateLocation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Guardar ubicación
        </Button>
      </div>
    </form>
  )
}

/* ───────────────────── Horarios ───────────────────── */

const horarioSchema = z
  .object({
    diaSemana: z.coerce.number().min(0).max(6),
    horaInicio: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida"),
    horaFin: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida"),
  })
  .refine((v) => v.horaFin > v.horaInicio, {
    message: "La hora fin debe ser posterior a la de inicio",
    path: ["horaFin"],
  })
type HorarioIn = z.input<typeof horarioSchema>
type HorarioOut = z.output<typeof horarioSchema>

const excepcionSchema = z
  .object({
    fechaInicio: z.string().min(1, "Requerido"),
    fechaFin: z.string().min(1, "Requerido"),
    motivo: z.string().min(5, "Mínimo 5 caracteres").max(200, "Máximo 200 caracteres"),
  })
  .refine((v) => new Date(v.fechaFin) > new Date(v.fechaInicio), {
    message: "La fecha fin debe ser posterior a la de inicio",
    path: ["fechaFin"],
  })
type ExcepcionForm = z.infer<typeof excepcionSchema>

const toIso = (local: string) => new Date(local).toISOString()

function HorariosTab({ idUsuario }: { idUsuario: string }) {
  const horarios = useHorarios(idUsuario)
  const crear = useCrearHorario(idUsuario)
  const actualizar = useActualizarHorario(idUsuario)
  const eliminar = useEliminarHorario(idUsuario)
  const excepciones = useExcepciones(idUsuario)
  const crearExc = useCrearExcepcion(idUsuario)
  const eliminarExc = useEliminarExcepcion(idUsuario)

  const formH = useForm<HorarioIn, unknown, HorarioOut>({
    resolver: zodResolver(horarioSchema),
    defaultValues: { diaSemana: 1, horaInicio: "08:00", horaFin: "17:00" },
  })
  const formE = useForm<ExcepcionForm>({
    resolver: zodResolver(excepcionSchema),
    defaultValues: { fechaInicio: "", fechaFin: "", motivo: "" },
  })

  const porDia = new Map<number, Horario[]>()
  for (const h of horarios.data ?? []) {
    const list = porDia.get(h.diaSemana) ?? []
    list.push(h)
    porDia.set(h.diaSemana, list)
  }

  const onSubmitH = (v: HorarioOut) =>
    crear.mutate({ idUsuarioTecnico: idUsuario, activo: true, ...v })

  const onSubmitE = (v: ExcepcionForm) =>
    crearExc.mutate(
      { idUsuarioTecnico: idUsuario, fechaInicio: toIso(v.fechaInicio), fechaFin: toIso(v.fechaFin), motivo: v.motivo },
      { onSuccess: () => formE.reset() },
    )

  return (
    <div className="space-y-7">
      {/* Horario semanal */}
      <section className="space-y-4">
        <div>
          <p className="font-semibold">Horario semanal</p>
          <p className="text-sm text-muted-foreground">Franjas en las que estás disponible cada día.</p>
        </div>

        <div className="space-y-1.5">
          {DIAS_SEMANA.map((dia, idx) => {
            const slots = (porDia.get(idx) ?? []).sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
            return (
              <div key={dia} className="flex flex-wrap items-center gap-3 rounded-xl bg-muted/40 px-4 py-3">
                <span className="w-24 shrink-0 text-sm font-medium">{dia}</span>
                {slots.length === 0
                  ? <span className="text-sm text-muted-foreground">Sin horario</span>
                  : (
                    <div className="flex flex-wrap gap-2">
                      {slots.map((h) => (
                        <span
                          key={h.idHorario}
                          className={cn(
                            "inline-flex items-center gap-2 rounded-full py-1 pl-3 pr-1.5 text-sm font-medium",
                            h.activo ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground line-through",
                          )}
                        >
                          {h.horaInicio.slice(0, 5)}–{h.horaFin.slice(0, 5)}
                          <button
                            type="button"
                            aria-label={h.activo ? "Desactivar" : "Activar"}
                            disabled={actualizar.isPending}
                            onClick={() => actualizar.mutate({ idHorario: h.idHorario, body: { activo: !h.activo } })}
                            className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-foreground/10 disabled:opacity-50"
                          >
                            <Power className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            aria-label="Eliminar"
                            disabled={eliminar.isPending}
                            onClick={() => eliminar.mutate(h.idHorario)}
                            className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-destructive/15 hover:text-destructive disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
              </div>
            )
          })}
        </div>

        <form
          onSubmit={formH.handleSubmit(onSubmitH)}
          className="grid gap-3 border-t border-border pt-4 sm:grid-cols-[1fr_auto_auto_auto]"
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="ep-dia">Día</Label>
            <Select id="ep-dia" {...formH.register("diaSemana")}>
              {DIAS_SEMANA.map((d, i) => <option key={d} value={i}>{d}</option>)}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ep-hini">Inicio</Label>
            <Input id="ep-hini" type="time" className="h-11" {...formH.register("horaInicio")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ep-hfin">Fin</Label>
            <Input id="ep-hfin" type="time" className="h-11" {...formH.register("horaFin")} />
          </div>
          <div className="flex items-end">
            <Button type="submit" className="h-11 w-full sm:w-auto" disabled={crear.isPending}>
              {crear.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Añadir
            </Button>
          </div>
          {formH.formState.errors.horaFin && (
            <p className="text-sm text-destructive sm:col-span-4">{formH.formState.errors.horaFin.message}</p>
          )}
        </form>
      </section>

      {/* Excepciones */}
      <section className="space-y-4 rounded-2xl border border-border p-4">
        <div className="flex items-center gap-2">
          <CalendarOff className="h-4 w-4 text-primary" />
          <p className="font-semibold">Días libres / excepciones</p>
        </div>

        {(excepciones.data ?? []).length === 0
          ? <p className="text-sm text-muted-foreground">Sin excepciones registradas.</p>
          : (excepciones.data ?? []).sort((a, b) => b.fechaInicio.localeCompare(a.fechaInicio)).map((e) => (
            <div key={e.idExcepcion} className="flex items-start justify-between gap-4 rounded-xl border border-border px-4 py-3">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{formatDateTime(e.fechaInicio)} → {formatDateTime(e.fechaFin)}</p>
                <p className="text-sm text-muted-foreground">{e.motivo}</p>
              </div>
              <button
                type="button"
                aria-label="Eliminar"
                disabled={eliminarExc.isPending}
                onClick={() => eliminarExc.mutate(e.idExcepcion)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/15 hover:text-destructive disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

        <form onSubmit={formE.handleSubmit(onSubmitE)} className="space-y-3 border-t border-border pt-3" noValidate>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ep-fini">Desde</Label>
              <Input id="ep-fini" type="datetime-local" className="h-11" {...formE.register("fechaInicio")} />
              {formE.formState.errors.fechaInicio && <p className="text-sm text-destructive">{formE.formState.errors.fechaInicio.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ep-ffin">Hasta</Label>
              <Input id="ep-ffin" type="datetime-local" className="h-11" {...formE.register("fechaFin")} />
              {formE.formState.errors.fechaFin && <p className="text-sm text-destructive">{formE.formState.errors.fechaFin.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ep-motivo">Motivo</Label>
            <Input id="ep-motivo" maxLength={200} placeholder="Ej. Vacaciones" className="h-11" {...formE.register("motivo")} />
            {formE.formState.errors.motivo && <p className="text-sm text-destructive">{formE.formState.errors.motivo.message}</p>}
          </div>
          <div className="flex justify-end">
            <Button type="submit" variant="outline" disabled={crearExc.isPending}>
              {crearExc.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Añadir excepción
            </Button>
          </div>
        </form>
      </section>
    </div>
  )
}

/* ───────────────────── Modal principal ───────────────────── */

export function EditarPerfilModal({
  open,
  onClose,
  idUsuario,
  tecnico,
  telefonoRegistro,
}: {
  open: boolean
  onClose: () => void
  idUsuario: string
  tecnico?: Tecnico
  telefonoRegistro?: string
}) {
  const [tab, setTab] = useState<Tab>("datos")

  return (
    <Modal open={open} onClose={onClose} title="Editar perfil" size="3xl">
      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl bg-muted/50 p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
              tab === id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Scrollable content */}
      <div className="mt-5 max-h-[65vh] overflow-y-auto pr-1">
        {tab === "datos" && (
          <DatosTab
            idUsuario={idUsuario}
            tecnico={tecnico}
            telefonoRegistro={telefonoRegistro}
            onDone={onClose}
          />
        )}
        {tab === "ubicacion" && (
          <UbicacionTab
            idUsuario={idUsuario}
            tecnico={tecnico}
            onDone={onClose}
          />
        )}
        {tab === "horarios" && (
          <HorariosTab idUsuario={idUsuario} />
        )}
      </div>
    </Modal>
  )
}
