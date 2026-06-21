import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Power, BadgeCheck, FileText, Wrench, X, Plus } from "lucide-react"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { tecnicoNombre } from "@/types/technician"
import {
  useAsignarEspecialidad,
  useEspecialidadesCatalogo,
  useMisEspecialidades,
  useRemoverEspecialidad,
  useTecnicoProfile,
  useUpdateDisponibilidad,
  useUpdateDocumentos,
  useUpdateTecnico,
} from "./use-tecnico-profile"

const datosSchema = z.object({
  nombresCompletos: z.string().min(2, "Mínimo 2 caracteres").max(255),
  dniRuc: z.string().regex(/^\d{8,20}$/, "8 a 20 dígitos").or(z.literal("")).optional(),
  experienciaAnios: z.coerce.number().min(0).max(50).optional(),
  tarifaBase: z.coerce.number().min(0.01).max(99999.99).optional(),
})
type DatosIn = z.input<typeof datosSchema>
type DatosOut = z.output<typeof datosSchema>

const DOC_FIELDS = [
  { key: "dniFrontalUrl", label: "DNI (frontal)" },
  { key: "dniTraseroUrl", label: "DNI (trasero)" },
  { key: "antecedentePenalUrl", label: "Antecedente penal" },
  { key: "certificadoTecnicoUrl", label: "Certificado técnico" },
] as const

const docsSchema = z.object({
  dniFrontalUrl: z.string().url().or(z.literal("")).optional(),
  dniTraseroUrl: z.string().url().or(z.literal("")).optional(),
  antecedentePenalUrl: z.string().url().or(z.literal("")).optional(),
  certificadoTecnicoUrl: z.string().url().or(z.literal("")).optional(),
})
type DocsForm = z.infer<typeof docsSchema>

export function TecnicoPerfilPage() {
  const idUsuario = useAuthStore((s) => s.user?.idUsuario) ?? ""
  const profile = useTecnicoProfile(idUsuario)
  const updateTecnico = useUpdateTecnico(idUsuario)
  const updateDocs = useUpdateDocumentos(idUsuario)
  const updateDisp = useUpdateDisponibilidad(idUsuario)

  const t = profile.data
  const disponible = t?.disponibilidad === "DISPONIBLE"

  const datos = useForm<DatosIn, unknown, DatosOut>({
    resolver: zodResolver(datosSchema),
    values: {
      nombresCompletos: t?.nombresCompletos ?? "",
      dniRuc: t?.dniRuc ?? "",
      experienciaAnios: t?.experienciaAnios,
      tarifaBase: t?.tarifaBase,
    },
  })

  const docs = useForm<DocsForm>({
    resolver: zodResolver(docsSchema),
    values: {
      dniFrontalUrl: (t?.dniFrontalUrl as string) ?? "",
      dniTraseroUrl: (t?.dniTraseroUrl as string) ?? "",
      antecedentePenalUrl: (t?.antecedentePenalUrl as string) ?? "",
      certificadoTecnicoUrl: (t?.certificadoTecnicoUrl as string) ?? "",
    },
  })

  if (profile.isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    )
  }

  const submitDatos = (v: DatosOut) =>
    updateTecnico.mutate({
      nombresCompletos: v.nombresCompletos,
      dniRuc: v.dniRuc || undefined,
      experienciaAnios: v.experienciaAnios,
      tarifaBase: v.tarifaBase,
    })

  const submitDocs = (v: DocsForm) =>
    // Only send non-empty URLs.
    updateDocs.mutate(
      Object.fromEntries(Object.entries(v).filter(([, val]) => val)) as DocsForm,
    )

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Mi perfil técnico</h1>
        <p className="mt-1 text-muted-foreground">Tus datos, disponibilidad y documentos.</p>
      </header>

      {/* Availability + approval */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-xl",
              disponible ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
            )}
          >
            <Power className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold">{disponible ? "Disponible" : "Ocupado"}</p>
            <p className="text-sm text-muted-foreground">
              {disponible ? "Recibes solicitudes de servicio" : "No apareces en búsquedas activas"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {t?.estadoAprobacion && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium">
              <BadgeCheck className="h-3.5 w-3.5 text-primary" />
              {t.estadoAprobacion}
            </span>
          )}
          <Button
            variant={disponible ? "outline" : "default"}
            disabled={updateDisp.isPending}
            onClick={() => updateDisp.mutate(disponible ? "OCUPADO" : "DISPONIBLE")}
          >
            {updateDisp.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {disponible ? "Marcar ocupado" : "Marcar disponible"}
          </Button>
        </div>
      </div>

      {/* Profile data */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-5 flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
            {tecnicoNombre(t ?? ({ idUsuario } as never)).slice(0, 2).toUpperCase()}
          </span>
          <p className="font-semibold">{t ? tecnicoNombre(t) : "Técnico"}</p>
        </div>
        <form onSubmit={datos.handleSubmit(submitDatos)} className="space-y-5" noValidate>
          <div className="space-y-2">
            <Label htmlFor="nombresCompletos">Nombres completos</Label>
            <Input id="nombresCompletos" className="h-11" {...datos.register("nombresCompletos")} />
            {datos.formState.errors.nombresCompletos && (
              <p className="text-sm text-destructive">{datos.formState.errors.nombresCompletos.message}</p>
            )}
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="dniRuc">DNI / RUC</Label>
              <Input id="dniRuc" inputMode="numeric" className="h-11" {...datos.register("dniRuc")} />
              {datos.formState.errors.dniRuc && (
                <p className="text-sm text-destructive">{datos.formState.errors.dniRuc.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="experienciaAnios">Experiencia (años)</Label>
              <Input
                id="experienciaAnios"
                type="number"
                min={0}
                max={50}
                className="h-11"
                {...datos.register("experienciaAnios")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tarifaBase">Tarifa base (S/)</Label>
              <Input
                id="tarifaBase"
                type="number"
                min={0}
                step="0.01"
                className="h-11"
                {...datos.register("tarifaBase")}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" className="px-6" disabled={updateTecnico.isPending}>
              {updateTecnico.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar datos
            </Button>
          </div>
        </form>
      </div>

      {/* Specialties */}
      <EspecialidadesSection idUsuario={idUsuario} />

      {/* Documents */}
      <div id="documentos" className="rounded-2xl border border-border bg-card p-6">
        <h2 className="inline-flex items-center gap-2 font-semibold">
          <FileText className="h-5 w-5 text-primary" />
          Documentos de verificación
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pega la URL de cada documento ya alojado.
        </p>
        <form onSubmit={docs.handleSubmit(submitDocs)} className="mt-5 space-y-4" noValidate>
          {DOC_FIELDS.map(({ key, label }) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key}>{label}</Label>
              <Input id={key} placeholder="https://..." className="h-11" {...docs.register(key)} />
              {docs.formState.errors[key] && (
                <p className="text-sm text-destructive">{docs.formState.errors[key]?.message}</p>
              )}
            </div>
          ))}
          <div className="flex justify-end">
            <Button type="submit" variant="outline" disabled={updateDocs.isPending}>
              {updateDocs.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar documentos
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

/** Gestión de especialidades del técnico: chips asignados + selector para añadir. */
function EspecialidadesSection({ idUsuario }: { idUsuario: string }) {
  const catalogo = useEspecialidadesCatalogo()
  const mias = useMisEspecialidades(idUsuario)
  const asignar = useAsignarEspecialidad(idUsuario)
  const remover = useRemoverEspecialidad(idUsuario)
  const [seleccion, setSeleccion] = useState("")

  const asignadas = mias.data ?? []
  const asignadasIds = new Set(asignadas.map((e) => e.idEspecialidad))
  const disponibles = (catalogo.data ?? []).filter((e) => !asignadasIds.has(e.idEspecialidad))

  const onAdd = () => {
    if (!seleccion) return
    asignar.mutate(seleccion, { onSuccess: () => setSeleccion("") })
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h2 className="inline-flex items-center gap-2 font-semibold">
        <Wrench className="h-5 w-5 text-primary" />
        Especialidades
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Las áreas en las que trabajas. Aparecen en tu perfil y en las búsquedas.
      </p>

      {/* Chips de especialidades asignadas */}
      <div className="mt-5">
        {mias.isLoading ? (
          <Skeleton className="h-9 w-full rounded-lg" />
        ) : asignadas.length ? (
          <div className="flex flex-wrap gap-2">
            {asignadas.map((e) => (
              <span
                key={e.idEspecialidad}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 py-1.5 pl-3 pr-1.5 text-sm font-medium text-primary"
              >
                {e.nombre}
                <button
                  type="button"
                  aria-label={`Quitar ${e.nombre}`}
                  disabled={remover.isPending}
                  onClick={() => remover.mutate(e.idEspecialidad)}
                  className="flex h-5 w-5 items-center justify-center rounded-full transition-colors hover:bg-primary/20 disabled:opacity-50"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Aún no has añadido especialidades.</p>
        )}
      </div>

      {/* Selector para añadir una especialidad del catálogo */}
      <div className="mt-5 flex items-end gap-3">
        <div className="flex-1 space-y-2">
          <Label htmlFor="add-especialidad">Añadir especialidad</Label>
          <Select
            id="add-especialidad"
            value={seleccion}
            disabled={catalogo.isLoading || !disponibles.length}
            onChange={(e) => setSeleccion(e.target.value)}
          >
            <option value="">
              {catalogo.isLoading
                ? "Cargando…"
                : disponibles.length
                  ? "Selecciona…"
                  : "No hay más especialidades"}
            </option>
            {disponibles.map((e) => (
              <option key={e.idEspecialidad} value={e.idEspecialidad}>
                {e.nombre}
              </option>
            ))}
          </Select>
        </div>
        <Button type="button" onClick={onAdd} disabled={!seleccion || asignar.isPending}>
          {asignar.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Añadir
        </Button>
      </div>
    </div>
  )
}
