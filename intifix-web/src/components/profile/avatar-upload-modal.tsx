import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { ImagePlus, Loader2, Upload, Camera, RotateCcw } from "lucide-react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { uploadsApi } from "@/api/uploads"
import { cn } from "@/lib/utils"

const MAX_BYTES = 5 * 1024 * 1024
const ACCEPT = "image/png,image/jpeg,image/webp"

/**
 * Modal estilo Instagram para subir/cambiar la foto de perfil: preview circular,
 * zona de arrastrar-y-soltar o clic para elegir, validación y subida a Cloudinary.
 * Reutilizable por técnico y cliente: el padre persiste la URL en `onUploaded`.
 */
export function AvatarUploadModal({
  open,
  onClose,
  currentUrl,
  onUploaded,
  nombre,
}: {
  open: boolean
  onClose: () => void
  currentUrl?: string
  onUploaded: (url: string) => void
  nombre?: string
}) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [subiendo, setSubiendo] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Preview local del archivo elegido (object URL liberado al cambiar).
  useEffect(() => {
    if (!file) {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  // Limpiar al cerrar.
  useEffect(() => {
    if (!open) {
      setFile(null)
      setDragging(false)
    }
  }, [open])

  const elegir = (f?: File | null) => {
    if (!f) return
    if (!f.type.startsWith("image/")) {
      toast.error("Selecciona una imagen (JPG, PNG o WEBP).")
      return
    }
    if (f.size > MAX_BYTES) {
      toast.error("La imagen no puede superar 5 MB.")
      return
    }
    setFile(f)
  }

  const guardar = async () => {
    if (!file) return
    setSubiendo(true)
    try {
      const url = await uploadsApi.file(file)
      onUploaded(url)
      toast.success("Foto de perfil actualizada")
      onClose()
    } catch {
      toast.error("No se pudo subir la foto")
    } finally {
      setSubiendo(false)
    }
  }

  const mostrada = preview ?? currentUrl

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Foto de perfil"
      description="Usa una imagen cuadrada para mejores resultados."
    >
      <div className="space-y-5">
        {/* Preview circular grande */}
        <div className="flex justify-center">
          <div className="relative h-40 w-40 overflow-hidden rounded-full border-4 border-muted bg-muted">
            {mostrada ? (
              <img src={mostrada} alt={nombre ?? "Foto de perfil"} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <Camera className="h-10 w-10" />
              </div>
            )}
          </div>
        </div>

        {/* Zona de arrastrar-y-soltar / clic */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            elegir(e.dataTransfer.files?.[0])
          }}
          className={cn(
            "flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition-colors",
            dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
          )}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ImagePlus className="h-5 w-5" />
          </span>
          <p className="text-sm font-medium">
            {file ? file.name : "Arrastra una foto aquí o haz clic para elegir"}
          </p>
          <p className="text-xs text-muted-foreground">JPG, PNG o WEBP · máx. 5 MB</p>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => {
              elegir(e.target.files?.[0])
              e.target.value = ""
            }}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          {file ? (
            <Button type="button" variant="ghost" onClick={() => setFile(null)} disabled={subiendo}>
              <RotateCcw className="h-4 w-4" />
              Elegir otra
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={subiendo}>
              Cancelar
            </Button>
            <Button type="button" onClick={guardar} disabled={!file || subiendo}>
              {subiendo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Guardar foto
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
