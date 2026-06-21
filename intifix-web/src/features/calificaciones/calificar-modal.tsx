import { useState } from "react"
import { Loader2, ThumbsUp, ThumbsDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Modal } from "@/components/ui/modal"
import { StarRating } from "@/components/shared/star-rating"
import { cn } from "@/lib/utils"
import { useCrearCalificacion } from "./use-calificaciones"

const SUB = [
  { key: "puntualidad", label: "Puntualidad" },
  { key: "profesionalismo", label: "Profesionalismo" },
  { key: "calidadTrabajo", label: "Calidad del trabajo" },
  { key: "comunicacion", label: "Comunicación" },
] as const

type SubKey = (typeof SUB)[number]["key"]

export function CalificarModal({
  idServicio,
  open,
  onClose,
}: {
  idServicio: string
  open: boolean
  onClose: () => void
}) {
  const crear = useCrearCalificacion(idServicio)
  const [puntuacion, setPuntuacion] = useState(0)
  const [sub, setSub] = useState<Record<SubKey, number>>({
    puntualidad: 0,
    profesionalismo: 0,
    calidadTrabajo: 0,
    comunicacion: 0,
  })
  const [comentario, setComentario] = useState("")
  const [recomendaria, setRecomendaria] = useState<boolean | null>(null)
  const [error, setError] = useState(false)

  const reset = () => {
    setPuntuacion(0)
    setSub({ puntualidad: 0, profesionalismo: 0, calidadTrabajo: 0, comunicacion: 0 })
    setComentario("")
    setRecomendaria(null)
    setError(false)
  }

  const close = () => {
    reset()
    onClose()
  }

  const submit = () => {
    if (puntuacion < 1) {
      setError(true)
      return
    }
    // Omit sub-scores left at 0 (they're optional).
    const optionalSub = Object.fromEntries(
      Object.entries(sub).filter(([, v]) => v > 0),
    ) as Partial<Record<SubKey, number>>

    crear.mutate(
      {
        idServicio,
        puntuacion,
        comentario: comentario.trim() || undefined,
        recomendaria: recomendaria ?? undefined,
        ...optionalSub,
      },
      { onSuccess: close },
    )
  }

  return (
    <Modal open={open} onClose={close} title="Calificar al técnico" description="Tu reseña ayuda a otros clientes.">
      <div className="space-y-6">
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-muted/40 py-5">
          <StarRating value={puntuacion} onChange={(v) => { setPuntuacion(v); setError(false) }} size={36} />
          <p className="text-sm text-muted-foreground">
            {["", "Malo", "Regular", "Bueno", "Muy bueno", "Excelente"][puntuacion] || "Toca para calificar"}
          </p>
          {error && <p className="text-sm text-destructive">Selecciona una puntuación</p>}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {SUB.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
              <span className="text-sm">{label}</span>
              <StarRating value={sub[key]} onChange={(v) => setSub((s) => ({ ...s, [key]: v }))} size={16} />
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <Label htmlFor="comentario">Comentario (opcional)</Label>
          <Textarea
            id="comentario"
            rows={3}
            maxLength={1000}
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="¿Qué tal fue tu experiencia?"
          />
        </div>

        <div className="space-y-2">
          <Label>¿Lo recomendarías?</Label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setRecomendaria(true)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition-colors",
                recomendaria === true
                  ? "border-success bg-success/10 text-success"
                  : "border-border hover:bg-muted",
              )}
            >
              <ThumbsUp className="h-4 w-4" /> Sí
            </button>
            <button
              type="button"
              onClick={() => setRecomendaria(false)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition-colors",
                recomendaria === false
                  ? "border-destructive bg-destructive/10 text-destructive"
                  : "border-border hover:bg-muted",
              )}
            >
              <ThumbsDown className="h-4 w-4" /> No
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={close}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={crear.isPending}>
            {crear.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Enviar calificación
          </Button>
        </div>
      </div>
    </Modal>
  )
}
