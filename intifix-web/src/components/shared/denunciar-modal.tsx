import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { Flag, Loader2 } from "lucide-react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { denunciasApi, type TipoReporte } from "@/api/denuncias"

const TIPOS: { value: TipoReporte; label: string }[] = [
  { value: "COMPORTAMIENTO", label: "Comportamiento inadecuado" },
  { value: "FRAUDE", label: "Fraude o estafa" },
  { value: "CALIDAD", label: "Mala calidad del servicio" },
  { value: "ACOSO", label: "Acoso o amenazas" },
  { value: "OTRO", label: "Otro motivo" },
]

interface DenunciarModalProps {
  open: boolean
  onClose: () => void
  idServicio: string
  idReportado: string
  nombreReportado: string
}

export function DenunciarModal({
  open,
  onClose,
  idServicio,
  idReportado,
  nombreReportado,
}: DenunciarModalProps) {
  const [tipo, setTipo] = useState<TipoReporte>("COMPORTAMIENTO")
  const [descripcion, setDescripcion] = useState("")
  const [error, setError] = useState("")

  const crear = useMutation({
    mutationFn: denunciasApi.crear,
    onSuccess: () => {
      toast.success("Denuncia enviada. Nuestro equipo la revisará.")
      setDescripcion("")
      setError("")
      onClose()
    },
    onError: () => {
      toast.error("No se pudo enviar la denuncia. Intenta de nuevo.")
    },
  })

  const handleSubmit = () => {
    if (descripcion.trim().length < 20) {
      setError("La descripción debe tener al menos 20 caracteres.")
      return
    }
    setError("")
    const tipoLabel = TIPOS.find((t) => t.value === tipo)?.label ?? tipo
    crear.mutate({
      idServicio,
      idReportado,
      tipoReporte: tipo,
      motivo: tipoLabel,
      descripcionDetallada: descripcion.trim(),
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Denunciar a ${nombreReportado}`}
      description="Tu reporte es anónimo. El equipo de IntiFix lo revisará y tomará las medidas correspondientes."
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="tipo-reporte">Motivo de la denuncia</Label>
          <Select
            id="tipo-reporte"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoReporte)}
          >
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="descripcion-denuncia">
            Descripción detallada <span className="text-muted-foreground text-xs">(mín. 20 caracteres)</span>
          </Label>
          <Textarea
            id="descripcion-denuncia"
            rows={4}
            placeholder="Describe con detalle qué ocurrió, cuándo y cualquier evidencia relevante…"
            value={descripcion}
            onChange={(e) => {
              setDescripcion(e.target.value)
              if (error) setError("")
            }}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <Flag className="mb-1 inline h-4 w-4 text-amber-500" /> Las denuncias falsas pueden resultar en la suspensión de tu cuenta.
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={crear.isPending}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={crear.isPending}
          >
            {crear.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4" />}
            Enviar denuncia
          </Button>
        </div>
      </div>
    </Modal>
  )
}
