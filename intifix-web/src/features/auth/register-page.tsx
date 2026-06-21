import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Link } from "react-router-dom"
import { Loader2, User, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { paths } from "@/routes/paths"
import { AuthLayout } from "./auth-layout"
import { useRegister } from "./use-auth"

const schema = z
  .object({
    rol: z.enum(["CLIENTE", "TECNICO"]),
    correo: z.string().email("Correo no válido"),
    clave: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .max(100, "Máximo 100 caracteres"),
    telefono: z
      .string()
      .regex(/^\d{10,20}$/, "Teléfono: 10 a 20 dígitos"),
    tipoDocumento: z.enum(["DNI", "RUC"]),
    dni: z.string().regex(/^\d+$/, "Solo dígitos"),
  })
  .superRefine((data, ctx) => {
    const len = data.tipoDocumento === "DNI" ? 8 : 11
    if (data.dni.length !== len) {
      ctx.addIssue({
        path: ["dni"],
        code: z.ZodIssueCode.custom,
        message:
          data.tipoDocumento === "DNI"
            ? "El DNI debe tener 8 dígitos"
            : "El RUC debe tener 11 dígitos",
      })
    }
  })

type RegisterForm = z.infer<typeof schema>

const ROLES = [
  { value: "CLIENTE" as const, icon: User, title: "Soy cliente", desc: "Necesito un técnico" },
  { value: "TECNICO" as const, icon: Wrench, title: "Soy técnico", desc: "Quiero ofrecer servicios" },
]

export function RegisterPage() {
  const registerMut = useRegister()
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(schema),
    defaultValues: { rol: "CLIENTE", tipoDocumento: "DNI" },
  })

  const tipoDoc = watch("tipoDocumento")
  const esDni = tipoDoc === "DNI"

  return (
    <AuthLayout title="Crea tu cuenta" subtitle="Únete a INTIFIX en menos de un minuto.">
      <form
        onSubmit={handleSubmit(({ rol, tipoDocumento: _tipo, ...rest }) =>
          registerMut.mutate({ ...rest, roles: [rol] }),
        )}
        className="space-y-5"
        noValidate
      >
        <Controller
          control={control}
          name="rol"
          render={({ field }) => (
            <div className="grid grid-cols-2 gap-3">
              {ROLES.map(({ value, icon: Icon, title, desc }) => {
                const active = field.value === value
                return (
                  <button
                    type="button"
                    key={value}
                    onClick={() => field.onChange(value)}
                    className={cn(
                      "flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all",
                      active
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:border-primary/40 hover:bg-muted/50",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-xl",
                        active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                      )}
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <span className="text-sm font-semibold">{title}</span>
                    <span className="text-xs text-muted-foreground">{desc}</span>
                  </button>
                )
              })}
            </div>
          )}
        />

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
          <Label htmlFor="telefono">Teléfono</Label>
          <Input
            id="telefono"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="987654321"
            aria-invalid={!!errors.telefono}
            className="h-11"
            {...register("telefono")}
          />
          {errors.telefono && <p className="text-sm text-destructive">{errors.telefono.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="dni">Documento de identidad</Label>
          <div className="flex gap-3">
            <Select
              id="tipoDocumento"
              className="h-11 w-28 shrink-0"
              aria-label="Tipo de documento"
              {...register("tipoDocumento")}
            >
              <option value="DNI">DNI</option>
              <option value="RUC">RUC</option>
            </Select>
            <Input
              id="dni"
              inputMode="numeric"
              maxLength={esDni ? 8 : 11}
              placeholder={esDni ? "8 dígitos" : "11 dígitos"}
              aria-invalid={!!errors.dni}
              className="h-11 flex-1"
              {...register("dni")}
            />
          </div>
          {errors.dni && <p className="text-sm text-destructive">{errors.dni.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="clave">Contraseña</Label>
          <Input
            id="clave"
            type="password"
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            aria-invalid={!!errors.clave}
            className="h-11"
            {...register("clave")}
          />
          {errors.clave && <p className="text-sm text-destructive">{errors.clave.message}</p>}
        </div>

        <Button type="submit" className="h-11 w-full text-base" disabled={registerMut.isPending}>
          {registerMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Crear cuenta
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link to={paths.login} className="font-medium text-primary hover:underline">
          Inicia sesión
        </Link>
      </p>
    </AuthLayout>
  )
}
