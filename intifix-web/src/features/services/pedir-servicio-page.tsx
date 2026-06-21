import { useRef, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate } from "react-router-dom"
import { Loader2, MapPin } from "lucide-react"
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
import { useCrearServicio } from "./use-services"

const schema = z.object({
  titulo: z.string().min(5, "Mínimo 5 caracteres").max(255, "Máximo 255 caracteres"),
  descripcion: z.string().min(10, "Mínimo 10 caracteres").max(2000, "Máximo 2000 caracteres"),
  modalidad: z.enum(["EN_CASA_CLIENTE", "EN_TALLER_TECNICO"]),
  prioridad: z.enum(["BAJA", "MEDIA", "ALTA", "URGENTE"]),
  presupuestoMaximo: z.coerce.number().min(0.01).max(999999.99).optional(),
  fechaProgramada: z
    .string()
    .min(1, "Elige fecha y hora")
    .refine((v) => new Date(v).getTime() > Date.now(), "Debe ser una fecha futura"),
  // Ubicación
  departamento: z.string().min(1, "Requerido").max(100),
  provincia: z.string().min(1, "Requerido").max(100),
  distrito: z.string().min(1, "Requerido").max(100),
  direccionTexto: z.string().min(1, "Requerido").max(255),
  referencia: z.string().max(500).optional(),
})

type FormIn = z.input<typeof schema>
type FormOut = z.output<typeof schema>

export function PedirServicioPage() {
  const navigate = useNavigate()
  const crear = useCrearServicio()
  const [location, setLocation] = useState<LatLng | null>(null)
  const [locError, setLocError] = useState(false)

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
      prioridad: "MEDIA",
      departamento: "",
      provincia: "",
      distrito: "",
    },
  })

  const depSel = watch("departamento")
  const provSel = watch("provincia")
  const provOptions = depSel ? provincias(depSel) : []
  const distOptions = depSel && provSel ? distritos(depSel, provSel) : []

  // Al elegir un distrito, centramos el mapa en él como punto de partida.
  const onDistritoChange = (dep: string, prov: string, dist: string) => {
    const c = dist ? distritoCoords(dep, prov, dist) : null
    if (c) {
      setLocation(c)
      setLocError(false)
    }
  }

  // Si los nombres del geocoder coinciden con el ubigeo, autocompleta los selects.
  // Probamos con fallbacks porque el geocoder a veces nombra distinto la provincia.
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

  // Resultado del buscador: fija pin, rellena la dirección y autocompleta ubigeo.
  const onAddress = (r: GeocodeResult) => {
    setLocation({ lat: r.lat, lng: r.lng })
    setLocError(false)
    setValue("direccionTexto", r.direccion, { shouldValidate: true })
    aplicarUbigeo(r)
  }

  // Clic/arrastre en el mapa: geocoding inverso → completa ubigeo y dirección.
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
        // Solo rellenamos la dirección si aún está vacía, para no pisar lo que
        // el usuario haya escrito a mano.
        if (!getValues("direccionTexto")?.trim()) {
          setValue("direccionTexto", r.direccion, { shouldValidate: true })
        }
      }
    } catch {
      /* abortado o sin conexión: el pin queda igual */
    } finally {
      if (revCtrl.current === ctrl) setGeoLoading(false)
    }
  }

  const onSubmit = (v: FormOut) => {
    if (!location) {
      setLocError(true)
      return
    }
    crear.mutate(
      {
        ubicacion: {
          departamento: v.departamento,
          provincia: v.provincia,
          distrito: v.distrito,
          direccionTexto: v.direccionTexto,
          referencia: v.referencia,
          latitud: Number(location.lat.toFixed(7)),
          longitud: Number(location.lng.toFixed(7)),
        },
        servicio: {
          titulo: v.titulo,
          descripcion: v.descripcion,
          modalidad: v.modalidad,
          prioridad: v.prioridad,
          presupuestoMaximo: v.presupuestoMaximo,
          fechaProgramada: new Date(v.fechaProgramada).toISOString(),
        },
      },
      { onSuccess: (s) => navigate(paths.cliente.servicioDetalle(s.idServicio)) },
    )
  }

  const fieldError = (msg?: string) =>
    msg ? <p className="text-sm text-destructive">{msg}</p> : null

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Pedir un servicio</h1>
        <p className="mt-1 text-muted-foreground">
          Describe tu problema. Técnicos verificados te enviarán cotizaciones.
        </p>
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

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="modalidad">Modalidad</Label>
              <Select id="modalidad" {...register("modalidad")}>
                <option value="EN_CASA_CLIENTE">En mi domicilio</option>
                <option value="EN_TALLER_TECNICO">En taller del técnico</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prioridad">Prioridad</Label>
              <Select id="prioridad" {...register("prioridad")}>
                <option value="BAJA">Baja</option>
                <option value="MEDIA">Media</option>
                <option value="ALTA">Alta</option>
                <option value="URGENTE">Urgente</option>
              </Select>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fechaProgramada">Fecha y hora</Label>
              <Input
                id="fechaProgramada"
                type="datetime-local"
                className="h-11"
                aria-invalid={!!errors.fechaProgramada}
                {...register("fechaProgramada")}
              />
              {fieldError(errors.fechaProgramada?.message)}
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
        </section>

        {/* --- Ubicación --- */}
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
                      <option key={d} value={d}>
                        {d}
                      </option>
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
                      <option key={p} value={p}>
                        {p}
                      </option>
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
                      onDistritoChange(depSel, provSel, e.target.value)
                    }}
                  >
                    <option value="">{provSel ? "Selecciona…" : "Elige provincia"}</option>
                    {distOptions.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
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
