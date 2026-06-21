import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, MapPin } from "lucide-react"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { LocationPicker, type LatLng } from "@/components/map/location-picker"
import { useTecnicoProfile, useUpdateLocation } from "./use-tecnico-profile"

const schema = z.object({
  departamento: z.string().min(1, "Requerido").max(100),
  provincia: z.string().min(1, "Requerido").max(100),
  distrito: z.string().min(1, "Requerido").max(100),
  direccionTexto: z.string().min(1, "Requerido").max(255),
  referencia: z.string().max(500).optional(),
})
type Form = z.infer<typeof schema>

export function TecnicoUbicacionPage() {
  const idUsuario = useAuthStore((s) => s.user?.idUsuario) ?? ""
  const profile = useTecnicoProfile(idUsuario)
  const updateLocation = useUpdateLocation(idUsuario)
  const [location, setLocation] = useState<LatLng | null>(null)
  const [locError, setLocError] = useState(false)

  const ub = profile.data?.ubicacion

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    values: {
      departamento: ub?.departamento ?? "",
      provincia: ub?.provincia ?? "",
      distrito: ub?.distrito ?? "",
      direccionTexto: ub?.direccionTexto ?? "",
      referencia: ub?.referencia ?? "",
    },
  })

  // Seed the pin from the existing location once it loads.
  useEffect(() => {
    if (ub?.latitud != null && ub?.longitud != null && !location) {
      setLocation({ lat: ub.latitud, lng: ub.longitud })
    }
  }, [ub, location])

  const onSubmit = (v: Form) => {
    if (!location) {
      setLocError(true)
      return
    }
    updateLocation.mutate({
      departamento: v.departamento,
      provincia: v.provincia,
      distrito: v.distrito,
      direccionTexto: v.direccionTexto,
      referencia: v.referencia,
      latitud: Number(location.lat.toFixed(7)),
      longitud: Number(location.lng.toFixed(7)),
    })
  }

  const fieldError = (msg?: string) =>
    msg ? <p className="text-sm text-destructive">{msg}</p> : null

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Mi ubicación</h1>
        <p className="mt-1 text-muted-foreground">
          Fija tu punto base para aparecer en búsquedas cercanas.
        </p>
      </header>

      {profile.isLoading ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          <div className="grid gap-5 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="departamento">Departamento</Label>
              <Input id="departamento" className="h-11" {...register("departamento")} />
              {fieldError(errors.departamento?.message)}
            </div>
            <div className="space-y-2">
              <Label htmlFor="provincia">Provincia</Label>
              <Input id="provincia" className="h-11" {...register("provincia")} />
              {fieldError(errors.provincia?.message)}
            </div>
            <div className="space-y-2">
              <Label htmlFor="distrito">Distrito</Label>
              <Input id="distrito" className="h-11" {...register("distrito")} />
              {fieldError(errors.distrito?.message)}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="direccionTexto">Dirección</Label>
            <Input id="direccionTexto" placeholder="Av. Pardo 123" className="h-11" {...register("direccionTexto")} />
            {fieldError(errors.direccionTexto?.message)}
          </div>
          <div className="space-y-2">
            <Label htmlFor="referencia">Referencia (opcional)</Label>
            <Input id="referencia" placeholder="Frente al parque" className="h-11" {...register("referencia")} />
          </div>

          <div className="space-y-2">
            <Label>Punto en el mapa</Label>
            <LocationPicker
              value={location}
              onChange={(p) => {
                setLocation(p)
                setLocError(false)
              }}
            />
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary" />
              {location
                ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
                : "Sin ubicación seleccionada"}
            </p>
            {locError && <p className="text-sm text-destructive">Marca un punto en el mapa</p>}
          </div>

          <div className="flex justify-end">
            <Button type="submit" className="px-6" disabled={updateLocation.isPending}>
              {updateLocation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar ubicación
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
