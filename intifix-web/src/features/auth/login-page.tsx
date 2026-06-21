import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Link } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { paths } from "@/routes/paths"
import { AuthLayout } from "./auth-layout"
import { useLogin } from "./use-auth"

const schema = z.object({
  correo: z.string().email("Correo no válido"),
  clave: z.string().min(1, "Ingresa tu contraseña"),
})

type LoginForm = z.infer<typeof schema>

export function LoginPage() {
  const login = useLogin()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(schema) })

  return (
    <AuthLayout title="Inicia sesión" subtitle="Bienvenido de vuelta a INTIFIX.">
      <form onSubmit={handleSubmit((v) => login.mutate(v))} className="space-y-5" noValidate>
        <div className="space-y-2">
          <Label htmlFor="correo">Correo electrónico</Label>
          <Input
            id="correo"
            type="email"
            autoComplete="email"
            placeholder="tucorreo@ejemplo.com"
            aria-invalid={!!errors.correo}
            className="h-11"
            {...register("correo")}
          />
          {errors.correo && <p className="text-sm text-destructive">{errors.correo.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="clave">Contraseña</Label>
          <Input
            id="clave"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            aria-invalid={!!errors.clave}
            className="h-11"
            {...register("clave")}
          />
          {errors.clave && <p className="text-sm text-destructive">{errors.clave.message}</p>}
        </div>

        <Button type="submit" className="h-11 w-full text-base" disabled={login.isPending}>
          {login.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Iniciar sesión
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿No tienes cuenta?{" "}
        <Link to={paths.register} className="font-medium text-primary hover:underline">
          Regístrate
        </Link>
      </p>
    </AuthLayout>
  )
}
