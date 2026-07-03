import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Modal } from "@/components/ui/modal"
import type { Servicio } from "@/types/service"
import { useSpecialties, useUpdateServicio } from "./use-services"

const schema = z.object({
  idEspecialidad: z.string().min(1, "Elige una especialidad"),
  titulo: z.string().min(5, "Mínimo 5 caracteres").max(255, "Máximo 255 caracteres"),
  descripcion: z.string().min(10, "Mínimo 10 caracteres").max(2000, "Máximo 2000 caracteres"),
  modalidad: z.enum(["EN_CASA_CLIENTE", "EN_TALLER_TECNICO"]),
  presupuestoMaximo: z.coerce.number().min(0.01).max(999999.99).optional(),
  fechaProgramada: z
    .string()
    .min(1, "Elige fecha y hora")
    .refine((v) => new Date(v).getTime() > Date.now(), "Debe ser una fecha futura"),
})
type FormIn = z.input<typeof schema>
type FormOut = z.output<typeof schema>

/** ISO string → value usable by <input type="datetime-local"> (local time). */
function toLocalInput(iso?: string): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function EditarServicioModal({
  servicio,
  open,
  onClose,
}: {
  servicio: Servicio
  open: boolean
  onClose: () => void
}) {
  const update = useUpdateServicio(servicio.idServicio)
  const specialties = useSpecialties()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormIn, unknown, FormOut>({
    resolver: zodResolver(schema),
    values: {
      idEspecialidad: servicio.idEspecialidad ?? "",
      titulo: servicio.titulo ?? "",
      descripcion: servicio.descripcion ?? "",
      modalidad: (servicio.modalidad as FormIn["modalidad"]) ?? "EN_CASA_CLIENTE",
      presupuestoMaximo: servicio.presupuestoMaximo,
      fechaProgramada: toLocalInput(servicio.fechaProgramada),
    },
  })

  const onSubmit = (v: FormOut) =>
    update.mutate(
      {
        idEspecialidad: v.idEspecialidad,
        titulo: v.titulo,
        descripcion: v.descripcion,
        modalidad: v.modalidad,
        presupuestoMaximo: v.presupuestoMaximo,
        fechaProgramada: new Date(v.fechaProgramada).toISOString(),
      },
      { onSuccess: onClose },
    )

  return (
    <Modal open={open} onClose={onClose} title="Editar servicio" description={servicio.titulo}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="space-y-2">
          <Label htmlFor="edit-especialidad">Especialidad</Label>
          <Select
            id="edit-especialidad"
            disabled={specialties.isLoading}
            aria-invalid={!!errors.idEspecialidad}
            {...register("idEspecialidad")}
          >
            <option value="" disabled>
              {specialties.isLoading ? "Cargando…" : "Selecciona una especialidad"}
            </option>
            {specialties.data?.map((e) => (
              <option key={e.idEspecialidad} value={e.idEspecialidad}>
                {e.nombre}
              </option>
            ))}
          </Select>
          {errors.idEspecialidad && (
            <p className="text-sm text-destructive">{errors.idEspecialidad.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-titulo">Título</Label>
          <Input
            id="edit-titulo"
            className="h-11"
            aria-invalid={!!errors.titulo}
            {...register("titulo")}
          />
          {errors.titulo && <p className="text-sm text-destructive">{errors.titulo.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-descripcion">Descripción</Label>
          <Textarea
            id="edit-descripcion"
            rows={4}
            aria-invalid={!!errors.descripcion}
            {...register("descripcion")}
          />
          {errors.descripcion && (
            <p className="text-sm text-destructive">{errors.descripcion.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-modalidad">Modalidad</Label>
          <Select id="edit-modalidad" {...register("modalidad")}>
            <option value="EN_CASA_CLIENTE">En mi domicilio</option>
            <option value="EN_TALLER_TECNICO">En taller del técnico</option>
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="edit-fecha">Fecha y hora</Label>
            <Input
              id="edit-fecha"
              type="datetime-local"
              className="h-11"
              aria-invalid={!!errors.fechaProgramada}
              {...register("fechaProgramada")}
            />
            {errors.fechaProgramada && (
              <p className="text-sm text-destructive">{errors.fechaProgramada.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-presupuesto">Presupuesto máximo (opcional)</Label>
            <Input
              id="edit-presupuesto"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              className="h-11"
              {...register("presupuestoMaximo")}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={update.isPending}>
            {update.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar cambios
          </Button>
        </div>
      </form>
    </Modal>
  )
}
