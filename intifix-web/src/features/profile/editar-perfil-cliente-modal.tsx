import { useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, MapPin, User, Check } from "lucide-react"
import { toast } from "sonner"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AddressSearch } from "@/components/map/address-search"
import { LocationPicker, type LatLng } from "@/components/map/location-picker"
import { reverseGeocode, type GeocodeResult } from "@/api/geocode"
import { ubicacionesApi } from "@/api/ubicaciones"
import { cn } from "@/lib/utils"
import { useUbicacion } from "@/features/services/use-services"
import { useAuthStore } from "@/stores/auth-store"
import {
  useUpdateCliente,
  useUpdateClienteLocation,
  useUpdateTelefono,
} from "./use-cliente-profile"
import type { Cliente } from "@/types/cliente"

type Tab = "datos" | "ubicacion"
type TipoDoc = "DNI" | "RUC"

const TABS: { id: Tab; label: string; icon: typeof User }[] = [
  { id: "datos", label: "Datos personales", icon: User },
  { id: "ubicacion", label: "Ubicación", icon: MapPin },
]

/* ───────────────────── Datos personales ───────────────────── */

const makeDatosSchema = (tipo: TipoDoc) =>
  z.object({
    nombresCompletos: z.string().min(2, "Mínimo 2 caracteres").max(255, "Máximo 255 caracteres"),
    dniRuc:
      tipo === "DNI"
        ? z
            .string()
            .regex(/^\d{8}$/, "El DNI debe tener exactamente 8 dígitos")
            .or(z.literal(""))
            .optional()
        : z
            .string()
            .regex(/^\d{11}$/, "El RUC debe tener exactamente 11 dígitos")
            .or(z.literal(""))
            .optional(),
    telefono: z
      .string()
      .regex(/^\d{6,20}$/, "Teléfono: solo dígitos, entre 6 y 20")
      .or(z.literal(""))
      .optional(),
  })

type DatosIn = z.input<ReturnType<typeof makeDatosSchema>>
type DatosOut = z.output<ReturnType<typeof makeDatosSchema>>

function DatosTab({
  idUsuario,
  cliente,
  onDone,
}: {
  idUsuario: string
  cliente?: Cliente
  onDone: () => void
}) {
  const { user } = useAuthStore()
  const update = useUpdateCliente(idUsuario)
  const updateTel = useUpdateTelefono()

  const existing = cliente?.dniRuc ?? ""
  const [tipoDoc, setTipoDoc] = useState<TipoDoc>(existing.length === 11 ? "RUC" : "DNI")

  const form = useForm<DatosIn, unknown, DatosOut>({
    resolver: zodResolver(makeDatosSchema(tipoDoc)),
    values: {
      nombresCompletos: cliente?.nombresCompletos ?? "",
      dniRuc: existing,
      telefono: user?.telefono ?? "",
    },
  })

  const handleTipoDoc = (t: TipoDoc) => {
    setTipoDoc(t)
    form.setValue("dniRuc", "")
    form.clearErrors("dniRuc")
  }

  const nombreVal = form.watch("nombresCompletos") ?? ""
  const err = form.formState.errors

  const onSubmit = async (v: DatosOut) => {
    const updates: Array<Promise<unknown>> = [
      update.mutateAsync({
        nombresCompletos: v.nombresCompletos,
        dniRuc: v.dniRuc || undefined,
      }),
    ]
    if (v.telefono && v.telefono !== (user?.telefono ?? "")) {
      updates.push(updateTel.mutateAsync(v.telefono))
    }
    await Promise.all(updates).catch(() => {})
    onDone()
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {/* Nombre */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="cp-nombre">Nombre completo</Label>
          <span
            className={cn(
              "text-xs tabular-nums",
              nombreVal.length > 230 ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {nombreVal.length}/255
          </span>
        </div>
        <Input
          id="cp-nombre"
          className="h-11"
          maxLength={255}
          placeholder="María García Quispe"
          {...form.register("nombresCompletos")}
        />
        {err.nombresCompletos && (
          <p className="text-sm text-destructive">{err.nombresCompletos.message}</p>
        )}
      </div>

      {/* DNI / RUC + Teléfono */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="cp-dniRuc">Número de documento</Label>
            {/* Toggle pill DNI / RUC */}
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
            id="cp-dniRuc"
            inputMode="numeric"
            maxLength={tipoDoc === "DNI" ? 8 : 11}
            placeholder={tipoDoc === "DNI" ? "12345678" : "20501234567"}
            className="h-11"
            {...form.register("dniRuc")}
          />
          <p className="text-xs text-muted-foreground">
            {tipoDoc === "DNI" ? "8 dígitos exactos" : "11 dígitos (empieza en 20 o 10)"}
          </p>
          {err.dniRuc && <p className="text-sm text-destructive">{err.dniRuc.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cp-tel">Teléfono</Label>
          <Input
            id="cp-tel"
            inputMode="numeric"
            maxLength={20}
            placeholder="987 654 321"
            className="h-11"
            {...form.register("telefono")}
          />
          <p className="text-xs text-muted-foreground">Solo dígitos, 6-20 caracteres</p>
          {err.telefono && <p className="text-sm text-destructive">{err.telefono.message}</p>}
        </div>
      </div>

      <div className="flex justify-end border-t border-border pt-4">
        <Button
          type="submit"
          className="px-8"
          disabled={update.isPending || updateTel.isPending}
        >
          {(update.isPending || updateTel.isPending) && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          Guardar datos
        </Button>
      </div>
    </form>
  )
}

/* ───────────────────── Ubicación ───────────────────── */

function UbicacionTab({
  idUsuario,
  idUbicacion,
  onDone,
}: {
  idUsuario: string
  idUbicacion?: string
  onDone: () => void
}) {
  const guardada = useUbicacion(idUbicacion)
  const updateLoc = useUpdateClienteLocation(idUsuario)
  const [punto, setPunto] = useState<LatLng | null>(null)
  const [datos, setDatos] = useState<GeocodeResult | null>(null)
  const [geoLoading, setGeoLoading] = useState(false)
  const revCtrl = useRef<AbortController | null>(null)

  const onAddress = (r: GeocodeResult) => {
    setPunto({ lat: r.lat, lng: r.lng })
    setDatos(r)
  }

  const onMapPick = async (p: LatLng) => {
    setPunto(p)
    revCtrl.current?.abort()
    const ctrl = new AbortController()
    revCtrl.current = ctrl
    setGeoLoading(true)
    try {
      const r = await reverseGeocode(p.lat, p.lng, ctrl.signal)
      if (r) setDatos({ ...r, lat: p.lat, lng: p.lng })
    } catch {
      /* abortado o sin red */
    } finally {
      if (revCtrl.current === ctrl) setGeoLoading(false)
    }
  }

  const guardar = async () => {
    if (!punto) return
    try {
      const ubic = await ubicacionesApi.create({
        departamento: datos?.departamento || "—",
        provincia: datos?.provincia || "—",
        distrito: datos?.distrito || "—",
        direccionTexto: datos?.direccion || "Ubicación marcada en el mapa",
        latitud: Number(punto.lat.toFixed(7)),
        longitud: Number(punto.lng.toFixed(7)),
      })
      updateLoc.mutate(ubic.idUbicacion, { onSuccess: onDone })
    } catch {
      toast.error("No se pudo guardar la ubicación")
    }
  }

  const zonaActual = [guardada.data?.distrito, guardada.data?.provincia]
    .filter(Boolean)
    .join(", ")

  return (
    <div className="space-y-5">
      {/* Zona guardada actual */}
      {idUbicacion && guardada.data && (
        <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/5 p-3">
          <Check className="h-4 w-4 shrink-0 text-success" />
          <p className="text-sm">
            Zona actual:{" "}
            <span className="font-medium">{zonaActual || "registrada"}</span>
          </p>
        </div>
      )}

      <div className="space-y-1.5">
        <Label>Buscar dirección o zona</Label>
        <AddressSearch onSelect={onAddress} placeholder="Busca tu calle, zona o referencia…" />
      </div>

      <div className="space-y-2">
        <Label>Punto en el mapa</Label>
        <LocationPicker value={punto} onChange={onMapPick} />
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          {geoLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-primary" /> Detectando zona…
            </>
          ) : datos?.distrito ? (
            <>
              <MapPin className="h-4 w-4 text-primary" /> {datos.distrito}
            </>
          ) : punto ? (
            <>
              <MapPin className="h-4 w-4 text-primary" /> {punto.lat.toFixed(5)},{" "}
              {punto.lng.toFixed(5)}
            </>
          ) : (
            <>
              <MapPin className="h-4 w-4" /> Toca el mapa o busca una dirección arriba
            </>
          )}
        </p>
      </div>

      <div className="flex justify-end border-t border-border pt-4">
        <Button onClick={guardar} disabled={!punto || updateLoc.isPending}>
          {updateLoc.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Guardar ubicación
        </Button>
      </div>
    </div>
  )
}

/* ───────────────────── Modal principal ───────────────────── */

export function EditarPerfilClienteModal({
  open,
  onClose,
  idUsuario,
  cliente,
}: {
  open: boolean
  onClose: () => void
  idUsuario: string
  cliente?: Cliente
}) {
  const [tab, setTab] = useState<Tab>("datos")

  return (
    <Modal open={open} onClose={onClose} title="Editar perfil" size="2xl">
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

      <div className="mt-5 max-h-[65vh] overflow-y-auto pr-1">
        {tab === "datos" && (
          <DatosTab
            idUsuario={idUsuario}
            cliente={cliente}
            onDone={onClose}
          />
        )}
        {tab === "ubicacion" && (
          <UbicacionTab
            idUsuario={idUsuario}
            idUbicacion={cliente?.idUbicacion}
            onDone={onClose}
          />
        )}
      </div>
    </Modal>
  )
}
