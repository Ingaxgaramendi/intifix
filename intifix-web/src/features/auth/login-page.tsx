import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Link } from "react-router-dom"
import { AlertTriangle, Ban, CheckCircle2, Loader2, Mail, MessageSquare, ShieldX } from "lucide-react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import type { AxiosError } from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { paths } from "@/routes/paths"
import { authApi } from "@/api/auth"
import { AuthLayout } from "./auth-layout"
import { useLogin } from "./use-auth"

const loginSchema = z.object({
  correo: z.string().email("Correo no válido"),
  clave: z.string().min(1, "Ingresa tu contraseña"),
})

const forgotSchema = z.object({
  correo: z.string().email("Correo no válido"),
})

const appealSchema = z.object({
  mensaje: z
    .string()
    .min(20, "Escribe al menos 20 caracteres")
    .max(2000, "Máximo 2000 caracteres"),
})

type LoginForm = z.infer<typeof loginSchema>
type ForgotForm = z.infer<typeof forgotSchema>
type AppealForm = z.infer<typeof appealSchema>

interface BlockedInfo {
  type: "ACCOUNT_SUSPENDED" | "ACCOUNT_BANNED"
  message: string
  correo: string
}

/* ------------------------------------------------------------------ helpers */

function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
  })
  const forgot = useMutation({
    mutationFn: (data: ForgotForm) => authApi.forgotPassword(data.correo),
    onSuccess: () => setSent(true),
    onError: () => toast.error("No se pudo enviar el correo. Inténtalo de nuevo."),
  })
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Mail className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-semibold">Recuperar contraseña</h2>
            <p className="text-sm text-muted-foreground">Te enviamos un enlace por correo</p>
          </div>
        </div>
        {sent ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-success/20 bg-success/10 p-4 text-sm text-success-foreground">
              Si ese correo está registrado, recibirás las instrucciones en los próximos minutos.
              Revisa también tu carpeta de spam.
            </div>
            <Button className="w-full" onClick={onClose}>Entendido</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit((v) => forgot.mutate(v))} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="forgot-correo">Correo electrónico</Label>
              <Input
                id="forgot-correo"
                type="email"
                autoComplete="email"
                placeholder="tucorreo@ejemplo.com"
                className="h-11"
                aria-invalid={!!errors.correo}
                {...register("correo")}
              />
              {errors.correo && <p className="text-sm text-destructive">{errors.correo.message}</p>}
            </div>
            <Button type="submit" className="h-11 w-full" disabled={forgot.isPending}>
              {forgot.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Enviar instrucciones
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={onClose}>Cancelar</Button>
          </form>
        )}
      </div>
    </div>
  )
}

/* ----------------------------- Pantalla de cuenta bloqueada + reclamo ------ */

function AccountBlockedScreen({
  info,
  onVolver,
}: {
  info: BlockedInfo
  onVolver: () => void
}) {
  const isBan = info.type === "ACCOUNT_BANNED"
  const [sent, setSent] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<AppealForm>({
    resolver: zodResolver(appealSchema),
  })

  const apelar = useMutation({
    mutationFn: (data: AppealForm) => authApi.apelar(info.correo, data.mensaje),
    onSuccess: () => setSent(true),
    onError: () => toast.error("No pudimos enviar tu reclamo. Inténtalo de nuevo."),
  })

  const msgLen = watch("mensaje")?.length ?? 0

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/95 p-4 pt-16 backdrop-blur-sm">
      <div className="w-full max-w-md">
        {/* Icono + título */}
        <div className="mb-6 flex flex-col items-center text-center">
          <span
            className={`flex h-20 w-20 items-center justify-center rounded-full ${
              isBan ? "bg-destructive/10" : "bg-amber-500/10"
            }`}
          >
            {isBan ? (
              <Ban className="h-10 w-10 text-destructive" />
            ) : (
              <ShieldX className="h-10 w-10 text-amber-500" />
            )}
          </span>
          <h1 className="mt-4 text-2xl font-bold">
            {isBan ? "Cuenta baneada" : "Cuenta suspendida"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{info.message}</p>
        </div>

        {sent ? (
          /* ---- Estado: reclamo enviado ---- */
          <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
            <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
            <h2 className="mt-3 font-semibold">Reclamo recibido</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              El equipo de soporte revisará tu caso y te contactará por correo.
            </p>
            <Button className="mt-5 w-full" variant="outline" onClick={onVolver}>
              Volver al inicio de sesión
            </Button>
          </div>
        ) : (
          /* ---- Formulario de reclamo ---- */
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2.5 text-xs text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {isBan
                ? "Esta acción es permanente. Solo se levanta si el equipo de soporte lo decide."
                : "La suspensión temporal se levanta automáticamente al vencer. Tu reclamo puede agilizarlo."}
            </div>

            <form onSubmit={handleSubmit((v) => apelar.mutate(v))} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="appeal-msg" className="flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4" />
                  Cuéntanos qué pasó
                </Label>
                <Textarea
                  id="appeal-msg"
                  rows={5}
                  placeholder="Explica por qué crees que esta decisión es incorrecta o cualquier detalle relevante..."
                  aria-invalid={!!errors.mensaje}
                  {...register("mensaje")}
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  {errors.mensaje ? (
                    <span className="text-destructive">{errors.mensaje.message}</span>
                  ) : (
                    <span>Mínimo 20 caracteres</span>
                  )}
                  <span>{msgLen}/2000</span>
                </div>
              </div>

              <Button type="submit" className="h-11 w-full" disabled={apelar.isPending}>
                {apelar.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Enviar reclamo
              </Button>
            </form>

            <button
              type="button"
              onClick={onVolver}
              className="mt-3 w-full text-center text-sm text-muted-foreground hover:text-foreground hover:underline"
            >
              Volver al inicio de sesión
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------- LoginPage */

export function LoginPage() {
  const login = useLogin()
  const [forgotOpen, setForgotOpen] = useState(false)
  const [blockedInfo, setBlockedInfo] = useState<BlockedInfo | null>(null)

  const { register, handleSubmit, getValues, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = (v: LoginForm) => {
    login.mutate(v, {
      onError: (err) => {
        const data = (err as AxiosError<{ errorCode?: string; message?: string }>).response?.data
        const code = data?.errorCode
        if (code === "ACCOUNT_SUSPENDED" || code === "ACCOUNT_BANNED") {
          setBlockedInfo({
            type: code,
            message: data?.message ?? "Tu cuenta no se encuentra activa.",
            correo: v.correo,
          })
        }
      },
    })
  }

  return (
    <>
      <AuthLayout title="Inicia sesión" subtitle="Bienvenido de vuelta a INTIFIX.">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
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
            <div className="flex items-center justify-between">
              <Label htmlFor="clave">Contraseña</Label>
              <button
                type="button"
                onClick={() => setForgotOpen(true)}
                className="text-xs text-primary hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
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

        {forgotOpen && <ForgotPasswordModal onClose={() => setForgotOpen(false)} />}
      </AuthLayout>

      {blockedInfo && (
        <AccountBlockedScreen
          info={blockedInfo}
          onVolver={() => setBlockedInfo(null)}
        />
      )}
    </>
  )
}
