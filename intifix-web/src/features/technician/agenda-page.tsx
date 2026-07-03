import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  CalendarDays,
  CalendarOff,
  Check,
  Clock,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { formatDateTime } from "@/lib/format"
import { DIAS_SEMANA, type Horario } from "@/types/technician"
import {
  useActualizarHorario,
  useCrearExcepcion,
  useCrearHorario,
  useEliminarExcepcion,
  useEliminarHorario,
  useExcepciones,
  useHorarios,
} from "./use-agenda"

/* --------------------------------- Horarios ------------------------------ */

const horarioSchema = z
  .object({
    diaSemana: z.coerce.number().min(0).max(6),
    horaInicio: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida"),
    horaFin: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida"),
  })
  .refine((v) => v.horaFin > v.horaInicio, {
    message: "La hora de fin debe ser posterior a la de inicio",
    path: ["horaFin"],
  })
type HorarioIn = z.input<typeof horarioSchema>
type HorarioOut = z.output<typeof horarioSchema>

function HorariosSection({ idUsuario }: { idUsuario: string }) {
  const horarios = useHorarios(idUsuario)
  const crear = useCrearHorario(idUsuario)
  const actualizar = useActualizarHorario(idUsuario)
  const eliminar = useEliminarHorario(idUsuario)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editHoras, setEditHoras] = useState({ horaInicio: "", horaFin: "" })

  const form = useForm<HorarioIn, unknown, HorarioOut>({
    resolver: zodResolver(horarioSchema),
    defaultValues: { diaSemana: 1, horaInicio: "08:00", horaFin: "17:00" },
  })

  const onSubmit = (v: HorarioOut) =>
    crear.mutate({ idUsuarioTecnico: idUsuario, activo: true, ...v }, { onSuccess: () => form.reset() })

  const startEdit = (h: Horario) => {
    setEditingId(h.idHorario)
    setEditHoras({ horaInicio: h.horaInicio.slice(0, 5), horaFin: h.horaFin.slice(0, 5) })
  }

  const saveEdit = (h: Horario) => {
    if (editHoras.horaFin <= editHoras.horaInicio) return
    actualizar.mutate(
      { idHorario: h.idHorario, body: { diaSemana: h.diaSemana, horaInicio: editHoras.horaInicio, horaFin: editHoras.horaFin } },
      { onSuccess: () => setEditingId(null) },
    )
  }

  // Group slots by weekday for a calendar-like layout.
  const porDia = new Map<number, Horario[]>()
  for (const h of horarios.data ?? []) {
    const list = porDia.get(h.diaSemana) ?? []
    list.push(h)
    porDia.set(h.diaSemana, list)
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <h2 className="inline-flex items-center gap-2 font-semibold">
        <Clock className="h-5 w-5 text-primary" />
        Horario semanal
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Define las franjas en las que estás disponible cada día de la semana.
      </p>

      {/* Weekly grid */}
      <div className="mt-5 space-y-2">
        {horarios.isLoading ? (
          <Skeleton className="h-40 w-full rounded-xl" />
        ) : (
          DIAS_SEMANA.map((dia, idx) => {
            const slots = (porDia.get(idx) ?? []).sort((a, b) =>
              a.horaInicio.localeCompare(b.horaInicio),
            )
            return (
              <div
                key={dia}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-border px-4 py-3"
              >
                <span className="w-24 shrink-0 text-sm font-medium">{dia}</span>
                {slots.length === 0 ? (
                  <span className="text-sm text-muted-foreground">Sin horario</span>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {slots.map((h) =>
                      editingId === h.idHorario ? (
                        // ── Edit mode ──────────────────────────────────────
                        <span
                          key={h.idHorario}
                          className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 py-1 pl-3 pr-1.5 text-sm font-medium text-primary"
                        >
                          <input
                            type="time"
                            value={editHoras.horaInicio}
                            onChange={(e) => setEditHoras((p) => ({ ...p, horaInicio: e.target.value }))}
                            className="w-18 bg-transparent outline-none"
                          />
                          <span className="text-primary/60">–</span>
                          <input
                            type="time"
                            value={editHoras.horaFin}
                            onChange={(e) => setEditHoras((p) => ({ ...p, horaFin: e.target.value }))}
                            className="w-18 bg-transparent outline-none"
                          />
                          <button
                            type="button"
                            aria-label="Guardar cambios"
                            disabled={actualizar.isPending || editHoras.horaFin <= editHoras.horaInicio}
                            onClick={() => saveEdit(h)}
                            className="flex h-5 w-5 items-center justify-center rounded-full transition-colors hover:bg-primary/20 disabled:opacity-40"
                          >
                            {actualizar.isPending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            aria-label="Cancelar edición"
                            onClick={() => setEditingId(null)}
                            className="flex h-5 w-5 items-center justify-center rounded-full transition-colors hover:bg-foreground/10"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ) : (
                        // ── View mode ───────────────────────────────────────
                        <span
                          key={h.idHorario}
                          className={cn(
                            "inline-flex items-center gap-2 rounded-full py-1 pl-3 pr-1.5 text-sm font-medium",
                            h.activo
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground line-through",
                          )}
                        >
                          {h.horaInicio.slice(0, 5)}–{h.horaFin.slice(0, 5)}
                          <button
                            type="button"
                            aria-label="Editar horas"
                            disabled={actualizar.isPending || eliminar.isPending}
                            onClick={() => startEdit(h)}
                            className="flex h-5 w-5 items-center justify-center rounded-full transition-colors hover:bg-foreground/10 disabled:opacity-50"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            aria-label="Eliminar horario"
                            disabled={eliminar.isPending}
                            onClick={() => eliminar.mutate(h.idHorario)}
                            className="flex h-5 w-5 items-center justify-center rounded-full transition-colors hover:bg-destructive/15 hover:text-destructive disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ),
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Add slot */}
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-[1fr_auto_auto_auto]"
        noValidate
      >
        <div className="space-y-2">
          <Label htmlFor="diaSemana">Día</Label>
          <Select id="diaSemana" {...form.register("diaSemana")}>
            {DIAS_SEMANA.map((dia, idx) => (
              <option key={dia} value={idx}>
                {dia}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="horaInicio">Inicio</Label>
          <Input id="horaInicio" type="time" className="h-11" {...form.register("horaInicio")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="horaFin">Fin</Label>
          <Input id="horaFin" type="time" className="h-11" {...form.register("horaFin")} />
        </div>
        <div className="flex items-end">
          <Button type="submit" className="h-11 w-full sm:w-auto" disabled={crear.isPending}>
            {crear.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Añadir
          </Button>
        </div>
        {form.formState.errors.horaFin && (
          <p className="text-sm text-destructive sm:col-span-4">
            {form.formState.errors.horaFin.message}
          </p>
        )}
      </form>
    </section>
  )
}

/* ------------------------------- Excepciones ----------------------------- */

const excepcionSchema = z
  .object({
    fechaInicio: z.string().min(1, "Requerido"),
    fechaFin: z.string().min(1, "Requerido"),
    motivo: z.string().min(10, "Mínimo 10 caracteres").max(500),
  })
  .refine((v) => new Date(v.fechaFin) > new Date(v.fechaInicio), {
    message: "La fecha de fin debe ser posterior a la de inicio",
    path: ["fechaFin"],
  })
type ExcepcionForm = z.infer<typeof excepcionSchema>

/** datetime-local needs ISO without the timezone suffix; the API wants full ISO. */
const toIso = (local: string) => new Date(local).toISOString()

function ExcepcionesSection({ idUsuario }: { idUsuario: string }) {
  const excepciones = useExcepciones(idUsuario)
  const crear = useCrearExcepcion(idUsuario)
  const eliminar = useEliminarExcepcion(idUsuario)

  const form = useForm<ExcepcionForm>({
    resolver: zodResolver(excepcionSchema),
    defaultValues: { fechaInicio: "", fechaFin: "", motivo: "" },
  })

  const onSubmit = (v: ExcepcionForm) =>
    crear.mutate(
      {
        idUsuarioTecnico: idUsuario,
        fechaInicio: toIso(v.fechaInicio),
        fechaFin: toIso(v.fechaFin),
        motivo: v.motivo,
      },
      { onSuccess: () => form.reset() },
    )

  const items = (excepciones.data ?? []).sort((a, b) =>
    b.fechaInicio.localeCompare(a.fechaInicio),
  )

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <h2 className="inline-flex items-center gap-2 font-semibold">
        <CalendarOff className="h-5 w-5 text-primary" />
        Excepciones y días libres
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Bloquea rangos puntuales (vacaciones, feriados) en los que no estarás disponible.
      </p>

      <div className="mt-5 space-y-2">
        {excepciones.isLoading ? (
          <Skeleton className="h-20 w-full rounded-xl" />
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No has registrado excepciones.</p>
        ) : (
          items.map((e) => (
            <div
              key={e.idExcepcion}
              className="flex items-start justify-between gap-4 rounded-xl border border-border px-4 py-3"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {formatDateTime(e.fechaInicio)} → {formatDateTime(e.fechaFin)}
                </p>
                <p className="text-sm text-muted-foreground">{e.motivo}</p>
              </div>
              <button
                type="button"
                aria-label="Eliminar excepción"
                disabled={eliminar.isPending}
                onClick={() => eliminar.mutate(e.idExcepcion)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mt-5 space-y-4 border-t border-border pt-5"
        noValidate
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fechaInicio">Desde</Label>
            <Input
              id="fechaInicio"
              type="datetime-local"
              className="h-11"
              {...form.register("fechaInicio")}
            />
            {form.formState.errors.fechaInicio && (
              <p className="text-sm text-destructive">{form.formState.errors.fechaInicio.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="fechaFin">Hasta</Label>
            <Input
              id="fechaFin"
              type="datetime-local"
              className="h-11"
              {...form.register("fechaFin")}
            />
            {form.formState.errors.fechaFin && (
              <p className="text-sm text-destructive">{form.formState.errors.fechaFin.message}</p>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="motivo">Motivo</Label>
          <Input
            id="motivo"
            placeholder="Ej. Vacaciones familiares"
            className="h-11"
            {...form.register("motivo")}
          />
          {form.formState.errors.motivo && (
            <p className="text-sm text-destructive">{form.formState.errors.motivo.message}</p>
          )}
        </div>
        <div className="flex justify-end">
          <Button type="submit" variant="outline" disabled={crear.isPending}>
            {crear.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Añadir excepción
          </Button>
        </div>
      </form>
    </section>
  )
}

export function AgendaPage() {
  const idUsuario = useAuthStore((s) => s.user?.idUsuario) ?? ""

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <CalendarDays className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mi agenda</h1>
          <p className="mt-1 text-muted-foreground">
            Tus horarios recurrentes y los días que no estarás disponible.
          </p>
        </div>
      </header>

      <HorariosSection idUsuario={idUsuario} />
      <ExcepcionesSection idUsuario={idUsuario} />
    </div>
  )
}
