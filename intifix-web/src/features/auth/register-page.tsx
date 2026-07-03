import { useEffect, useRef, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Link } from "react-router-dom"
import { Loader2, User, Wrench, X, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { paths } from "@/routes/paths"
import { useEspecialidadesCatalogo } from "@/features/profile/use-tecnico-profile"
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
    confirmarClave: z.string().min(1, "Repite tu contraseña"),
    telefono: z
      .string()
      .regex(/^\d{9}$/, "El teléfono debe tener 9 dígitos"),
    tipoDocumento: z.enum(["DNI", "RUC"]),
    dni: z.string().regex(/^\d+$/, "Solo dígitos"),
    especialidades: z.array(z.string()),
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
    if (data.clave !== data.confirmarClave) {
      ctx.addIssue({
        path: ["confirmarClave"],
        code: z.ZodIssueCode.custom,
        message: "Las contraseñas no coinciden",
      })
    }
    if (data.rol === "TECNICO" && data.especialidades.length === 0) {
      ctx.addIssue({
        path: ["especialidades"],
        code: z.ZodIssueCode.custom,
        message: "Selecciona al menos una especialidad",
      })
    }
  })

type RegisterForm = z.infer<typeof schema>

const ROLES = [
  { value: "CLIENTE" as const, icon: User, title: "Soy cliente", desc: "Necesito un técnico" },
  { value: "TECNICO" as const, icon: Wrench, title: "Soy técnico", desc: "Quiero ofrecer servicios" },
]

/** Searchable multi-select for specialties: type to filter, click to add chips. */
function EspecialidadAutocomplete({
  value,
  onChange,
  invalid,
}: {
  value: string[]
  onChange: (v: string[]) => void
  invalid?: boolean
}) {
  const { data: catalogo = [], isLoading } = useEspecialidadesCatalogo()
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [])

  const seleccionadas = catalogo.filter((e) => value.includes(e.idEspecialidad))
  const q = query.trim().toLowerCase()
  const matches = catalogo
    .filter((e) => !value.includes(e.idEspecialidad) && e.nombre.toLowerCase().includes(q))
    .slice(0, 8)

  const add = (id: string) => {
    onChange([...value, id])
    setQuery("")
    inputRef.current?.focus()
  }
  const remove = (id: string) => onChange(value.filter((x) => x !== id))

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen(true)
          inputRef.current?.focus()
        }}
        className={cn(
          "flex min-h-11 w-full flex-wrap items-center gap-2 rounded-md border bg-transparent p-2 text-left",
          invalid ? "border-destructive" : "border-input",
        )}
      >
        {seleccionadas.map((e) => (
          <span
            key={e.idEspecialidad}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 py-1 pl-3 pr-1.5 text-sm font-medium text-primary"
          >
            {e.nombre}
            <button
              type="button"
              aria-label={`Quitar ${e.nombre}`}
              onClick={(ev) => {
                ev.stopPropagation()
                remove(e.idEspecialidad)
              }}
              className="flex h-5 w-5 items-center justify-center rounded-full transition-colors hover:bg-primary/20"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
        <span className="flex min-w-[8rem] flex-1 items-center gap-2 px-1">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            placeholder={seleccionadas.length ? "Añadir otra…" : "Busca tu especialidad…"}
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </span>
      </button>

      {open && (
        <div className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-border bg-card py-1 shadow-lg">
          {isLoading ? (
            <p className="px-4 py-2 text-sm text-muted-foreground">Cargando…</p>
          ) : matches.length === 0 ? (
            <p className="px-4 py-2 text-sm text-muted-foreground">
              {q ? "Sin coincidencias" : "Escribe para buscar"}
            </p>
          ) : (
            matches.map((e) => (
              <button
                key={e.idEspecialidad}
                type="button"
                onClick={() => add(e.idEspecialidad)}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors hover:bg-muted"
              >
                <Wrench className="h-4 w-4 text-primary" />
                {e.nombre}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

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
    defaultValues: { rol: "CLIENTE", tipoDocumento: "DNI", especialidades: [] },
  })

  const tipoDoc = watch("tipoDocumento")
  const esDni = tipoDoc === "DNI"
  const esTecnico = watch("rol") === "TECNICO"

  return (
    <AuthLayout title="Crea tu cuenta" subtitle="Únete a INTIFIX en menos de un minuto.">
      <form
        onSubmit={handleSubmit(({ rol, tipoDocumento: _tipo, confirmarClave: _confirmar, ...rest }) =>
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
            maxLength={9}
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

        <div className="space-y-2">
          <Label htmlFor="confirmarClave">Confirmar contraseña</Label>
          <Input
            id="confirmarClave"
            type="password"
            autoComplete="new-password"
            placeholder="Repite tu contraseña"
            aria-invalid={!!errors.confirmarClave}
            className="h-11"
            {...register("confirmarClave")}
          />
          {errors.confirmarClave && (
            <p className="text-sm text-destructive">{errors.confirmarClave.message}</p>
          )}
        </div>

        {esTecnico && (
          <Controller
            control={control}
            name="especialidades"
            render={({ field }) => (
              <div className="space-y-2">
                <Label>Especialidades</Label>
                <EspecialidadAutocomplete
                  value={field.value ?? []}
                  onChange={field.onChange}
                  invalid={!!errors.especialidades}
                />
                {errors.especialidades && (
                  <p className="text-sm text-destructive">{errors.especialidades.message}</p>
                )}
              </div>
            )}
          />
        )}

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
