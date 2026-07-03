import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { Loader2, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authApi } from "@/api/auth"

const schema = z
  .object({
    passwordActual: z.string().min(1, "Ingresa tu contraseña actual"),
    nuevaPassword: z.string().min(8, "Mínimo 8 caracteres"),
    confirmar: z.string().min(1, "Confirma tu nueva contraseña"),
  })
  .refine((d) => d.nuevaPassword === d.confirmar, {
    message: "Las contraseñas no coinciden",
    path: ["confirmar"],
  })

type Form = z.infer<typeof schema>

interface Props {
  onClose: () => void
}

export function CambiarPasswordModal({ onClose }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema) })

  const cambiar = useMutation({
    mutationFn: (data: Form) => authApi.cambiarPassword(data.passwordActual, data.nuevaPassword),
    onSuccess: () => {
      toast.success("Contraseña actualizada. Revisa tu correo para confirmar el cambio.")
      onClose()
    },
    onError: () => toast.error("La contraseña actual no es correcta."),
  })

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Lock className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-semibold">Cambiar contraseña</h2>
            <p className="text-sm text-muted-foreground">Recibirás un correo de confirmación</p>
          </div>
        </div>

        <form onSubmit={handleSubmit((v) => cambiar.mutate(v))} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="cp-actual">Contraseña actual</Label>
            <Input
              id="cp-actual"
              type="password"
              autoComplete="current-password"
              className="h-11"
              placeholder="Tu contraseña actual"
              aria-invalid={!!errors.passwordActual}
              {...register("passwordActual")}
            />
            {errors.passwordActual && (
              <p className="text-sm text-destructive">{errors.passwordActual.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cp-nueva">Nueva contraseña</Label>
            <Input
              id="cp-nueva"
              type="password"
              autoComplete="new-password"
              className="h-11"
              placeholder="Mínimo 8 caracteres"
              aria-invalid={!!errors.nuevaPassword}
              {...register("nuevaPassword")}
            />
            {errors.nuevaPassword && (
              <p className="text-sm text-destructive">{errors.nuevaPassword.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cp-confirmar">Confirmar nueva contraseña</Label>
            <Input
              id="cp-confirmar"
              type="password"
              autoComplete="new-password"
              className="h-11"
              placeholder="Repite la nueva contraseña"
              aria-invalid={!!errors.confirmar}
              {...register("confirmar")}
            />
            {errors.confirmar && (
              <p className="text-sm text-destructive">{errors.confirmar.message}</p>
            )}
          </div>

          <Button type="submit" className="h-11 w-full" disabled={cambiar.isPending}>
            {cambiar.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Actualizar contraseña
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={onClose}>
            Cancelar
          </Button>
        </form>
      </div>
    </div>
  )
}
