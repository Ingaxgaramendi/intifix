import { useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import {
  Camera,
  Eye,
  Lock,
  MapPin,
  Pencil,
  Phone,
  CreditCard,
  User,
} from "lucide-react"
import { paths } from "@/routes/paths"
import { useAuthStore } from "@/stores/auth-store"
import { AvatarUploadModal } from "@/components/profile/avatar-upload-modal"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useUbicacion } from "@/features/services/use-services"
import { useClienteProfile, useUpdateCliente } from "./use-cliente-profile"
import { EditarPerfilClienteModal } from "./editar-perfil-cliente-modal"
import { CambiarPasswordModal } from "@/components/shared/cambiar-password-modal"

/** Chip de info rápida */
function InfoChip({ icon: Icon, text, muted }: { icon: typeof User; text: string; muted?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm", muted ? "bg-muted/30 text-muted-foreground" : "bg-muted/40")}>
      <Icon className="h-4 w-4 shrink-0 text-primary" />
      <span>{text}</span>
    </div>
  )
}

function UbicacionChip({ idUbicacion }: { idUbicacion?: string }) {
  const ubicacion = useUbicacion(idUbicacion)
  if (!idUbicacion || !ubicacion.data) return null
  const zona = [ubicacion.data.distrito, ubicacion.data.provincia].filter(Boolean).join(", ")
  if (!zona) return null
  return <InfoChip icon={MapPin} text={zona} />
}

export function ClientePerfilPage() {
  const { user, correo } = useAuthStore()
  const idUsuario = user?.idUsuario
  const profile = useClienteProfile(idUsuario)
  const update = useUpdateCliente(idUsuario ?? "")

  const [fotoUrl, setFotoUrl] = useState<string | null>(null)
  const [fotoModalOpen, setFotoModalOpen] = useState(false)
  const [editarOpen, setEditarOpen] = useState(false)
  const [cambiarPassOpen, setCambiarPassOpen] = useState(false)

  const cliente = profile.data
  const fotoActual = fotoUrl ?? cliente?.fotoPerfilUrl ?? ""
  const nombre = cliente?.nombresCompletos ?? correo?.split("@")[0] ?? "Cliente"

  const onFotoSubida = (url: string) => {
    setFotoUrl(url)
    update.mutate({ fotoPerfilUrl: url }, {
      onError: () => toast.error("No se pudo actualizar la foto"),
    })
  }

  if (profile.isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Skeleton className="h-9 w-52" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mi perfil</h1>
          <p className="mt-1 text-muted-foreground">Administra tu información personal.</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to={paths.cliente.miPerfilPublico}>
            <Eye className="h-4 w-4" /> Ver mi perfil público
          </Link>
        </Button>
      </header>

      {/* Tarjeta de presentación */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <button
            type="button"
            onClick={() => setFotoModalOpen(true)}
            className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl"
            aria-label="Cambiar foto de perfil"
          >
            {fotoActual ? (
              <img src={fotoActual} alt={nombre} className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-primary/10 text-2xl font-bold text-primary">
                {nombre.slice(0, 2).toUpperCase()}
              </span>
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="h-5 w-5 text-white" />
            </span>
          </button>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <p className="text-xl font-bold leading-tight">{nombre}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{correo}</p>

            {/* Chips de datos */}
            <div className="mt-3 flex flex-wrap gap-2">
              {user?.telefono && <InfoChip icon={Phone} text={user.telefono} />}
              {cliente?.dniRuc && (
                <InfoChip
                  icon={CreditCard}
                  text={`${cliente.dniRuc.length === 11 ? "RUC" : "DNI"}: ${cliente.dniRuc}`}
                />
              )}
              <UbicacionChip idUbicacion={cliente?.idUbicacion} />
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
          <p className="text-sm text-muted-foreground">
            {cliente?.idUbicacion
              ? "Ubicación guardada · usada para mostrarte técnicos cercanos"
              : "Añade tu ubicación para encontrar técnicos cercanos"}
          </p>
          <Button size="sm" onClick={() => setEditarOpen(true)}>
            <Pencil className="h-4 w-4" />
            Editar perfil
          </Button>
        </div>
      </div>

      {/* Seguridad */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="inline-flex items-center gap-2 font-semibold">
          <Lock className="h-5 w-5 text-primary" />
          Seguridad
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Mantén tu cuenta protegida con una contraseña segura.
        </p>
        <div className="mt-4">
          <Button variant="outline" size="sm" onClick={() => setCambiarPassOpen(true)}>
            <Lock className="h-4 w-4" />
            Cambiar contraseña
          </Button>
        </div>
      </div>

      {/* Modal edición */}
      {idUsuario && (
        <EditarPerfilClienteModal
          open={editarOpen}
          onClose={() => setEditarOpen(false)}
          idUsuario={idUsuario}
          cliente={cliente}
        />
      )}

      <AvatarUploadModal
        open={fotoModalOpen}
        onClose={() => setFotoModalOpen(false)}
        currentUrl={fotoActual || undefined}
        onUploaded={onFotoSubida}
        nombre={nombre}
      />

      {cambiarPassOpen && <CambiarPasswordModal onClose={() => setCambiarPassOpen(false)} />}
    </div>
  )
}
