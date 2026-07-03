import { useEffect, useState } from "react"
import { useNavigate, useSearchParams, Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { Loader2, ShieldCheck, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authApi } from "@/api/auth"
import { paths } from "@/routes/paths"
import { AuthLayout } from "./auth-layout"

const schema = z
  .object({
    nuevaPassword: z.string().min(8, "Mínimo 8 caracteres"),
    confirmar: z.string().min(1, "Confirma tu contraseña"),
  })
  .refine((d) => d.nuevaPassword === d.confirmar, {
    message: "Las contraseñas no coinciden",
    path: ["confirmar"],
  })

type ResetForm = z.infer<typeof schema>

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get("token")
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!token) navigate(paths.login, { replace: true })
  }, [token, navigate])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetForm>({ resolver: zodResolver(schema) })

  const reset = useMutation({
    mutationFn: (data: ResetForm) => authApi.resetPassword(token!, data.nuevaPassword),
    onSuccess: () => {
      setDone(true)
      toast.success("Contraseña actualizada correctamente")
    },
    onError: () =>
      toast.error("El enlace no es válido o ha expirado. Solicita uno nuevo desde el login."),
  })

  if (!token) return null

  return (
    <AuthLayout title="Nueva contraseña" subtitle="Elige una contraseña segura para tu cuenta.">
      {done ? (
        <div className="space-y-5 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
            <ShieldCheck className="h-8 w-8" />
          </span>
          <div>
            <p className="font-semibold text-foreground">¡Contraseña actualizada!</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Ahora puedes iniciar sesión con tu nueva contraseña.
            </p>
          </div>
          <Button asChild className="h-11 w-full text-base">
            <Link to={paths.login}>Ir al inicio de sesión</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit((v) => reset.mutate(v))} className="space-y-5" noValidate>
          <div className="rounded-xl border border-warning/30 bg-warning/5 p-3 flex items-start gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-warning" />
            <span>Este enlace es válido por <strong>1 hora</strong> desde que fue solicitado.</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nuevaPassword">Nueva contraseña</Label>
            <Input
              id="nuevaPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              className="h-11"
              aria-invalid={!!errors.nuevaPassword}
              {...register("nuevaPassword")}
            />
            {errors.nuevaPassword && (
              <p className="text-sm text-destructive">{errors.nuevaPassword.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmar">Confirmar contraseña</Label>
            <Input
              id="confirmar"
              type="password"
              autoComplete="new-password"
              placeholder="Repite la contraseña"
              className="h-11"
              aria-invalid={!!errors.confirmar}
              {...register("confirmar")}
            />
            {errors.confirmar && (
              <p className="text-sm text-destructive">{errors.confirmar.message}</p>
            )}
          </div>

          <Button type="submit" className="h-11 w-full text-base" disabled={reset.isPending}>
            {reset.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Actualizar contraseña
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
