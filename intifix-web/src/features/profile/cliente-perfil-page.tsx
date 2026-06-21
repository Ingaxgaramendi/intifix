import { useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Upload } from "lucide-react"
import { toast } from "sonner"
import { useAuthStore } from "@/stores/auth-store"
import { uploadsApi } from "@/api/uploads"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { useClienteProfile, useUpdateCliente, useUpdateTelefono } from "./use-cliente-profile"

const schema = z.object({
  nombresCompletos: z.string().min(2, "Mínimo 2 caracteres").max(255),
  dniRuc: z
    .string()
    .regex(/^(\d{8}|\d{11})$/, "DNI (8) o RUC (11) dígitos")
    .or(z.literal(""))
    .optional(),
  telefono: z.string().regex(/^\d{10,20}$/, "Teléfono: 10 a 20 dígitos"),
})
type Form = z.infer<typeof schema>

export function ClientePerfilPage() {
  const { user, correo } = useAuthStore()
  const idUsuario = user?.idUsuario
  const profile = useClienteProfile(idUsuario)
  const update = useUpdateCliente(idUsuario ?? "")
  const updateTel = useUpdateTelefono()

  const [fotoUrl, setFotoUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // URL efectiva: la recién subida o la guardada en el perfil.
  const fotoActual = fotoUrl ?? profile.data?.fotoPerfilUrl ?? ""

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    values: {
      nombresCompletos: profile.data?.nombresCompletos ?? "",
      dniRuc: profile.data?.dniRuc ?? "",
      telefono: user?.telefono ?? "",
    },
  })

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Selecciona una imagen (JPG, PNG, etc.)")
      return
    }
    setUploading(true)
    try {
      const url = await uploadsApi.image(file)
      setFotoUrl(url)
      toast.success("Imagen subida")
    } catch {
      toast.error("No se pudo subir la imagen")
    } finally {
      setUploading(false)
    }
  }

  const onSubmit = async (v: Form) => {
    update.mutate({
      nombresCompletos: v.nombresCompletos,
      dniRuc: v.dniRuc || undefined,
      fotoPerfilUrl: fotoActual || undefined,
    })
    if (v.telefono !== (user?.telefono ?? "")) {
      updateTel.mutate(v.telefono)
    }
  }

  const nombre = profile.data?.nombresCompletos ?? correo?.split("@")[0] ?? "Cliente"
  const guardando = update.isPending || updateTel.isPending

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Mi perfil</h1>
        <p className="mt-1 text-muted-foreground">Administra tu información personal.</p>
      </header>

      {profile.isLoading ? (
        <Skeleton className="h-80 rounded-2xl" />
      ) : (
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-6 flex items-center gap-4">
            {fotoActual ? (
              <img src={fotoActual} alt={nombre} className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary">
                {nombre.slice(0, 2).toUpperCase()}
              </span>
            )}
            <div className="flex-1">
              <p className="font-semibold">{nombre}</p>
              <p className="text-sm text-muted-foreground">{correo}</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={handleFile}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Cambiar foto
            </Button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="nombresCompletos">Nombres completos</Label>
              <Input
                id="nombresCompletos"
                className="h-11"
                aria-invalid={!!errors.nombresCompletos}
                {...register("nombresCompletos")}
              />
              {errors.nombresCompletos && (
                <p className="text-sm text-destructive">{errors.nombresCompletos.message}</p>
              )}
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dniRuc">DNI / RUC</Label>
                <Input
                  id="dniRuc"
                  inputMode="numeric"
                  className="h-11"
                  aria-invalid={!!errors.dniRuc}
                  {...register("dniRuc")}
                />
                {errors.dniRuc && <p className="text-sm text-destructive">{errors.dniRuc.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  inputMode="numeric"
                  className="h-11"
                  aria-invalid={!!errors.telefono}
                  {...register("telefono")}
                />
                {errors.telefono && (
                  <p className="text-sm text-destructive">{errors.telefono.message}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" className="px-6" disabled={guardando || uploading}>
                {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
                Guardar cambios
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
