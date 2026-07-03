import { useEffect, useRef, useState, memo } from "react"
import { toast } from "sonner"
import { FileUp, Loader2, Upload, X, FileText, Film, Image as ImageIcon } from "lucide-react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { uploadsApi } from "@/api/uploads"
import { useAuthStore } from "@/stores/auth-store"
import { useCrearEvidencia } from "@/features/technician/use-technician"
import { cn } from "@/lib/utils"
import type { TipoArchivo } from "@/types/service"

const MAX_BYTES = 15 * 1024 * 1024 // 15 MB
const ACCEPT = "image/*,video/*,application/pdf"

/** Deriva el tipo de evidencia del MIME; null si no es un formato soportado. */
function tipoDe(file: File): TipoArchivo | null {
  if (file.type.startsWith("image/")) return "IMAGEN"
  if (file.type.startsWith("video/")) return "VIDEO"
  if (file.type === "application/pdf") return "PDF"
  return null
}

function IconoTipo({ tipo, className }: { tipo: TipoArchivo; className?: string }) {
  if (tipo === "VIDEO") return <Film className={className} />
  if (tipo === "PDF") return <FileText className={className} />
  return <ImageIcon className={className} />
}

/** Muestra un thumbnail del archivo imagen; revoca el object URL al desmontar. */
const ImagePreview = memo(function ImagePreview({ file }: { file: File }) {
  const [src, setSrc] = useState<string>()
  useEffect(() => {
    const url = URL.createObjectURL(file)
    setSrc(url)
    return () => URL.revokeObjectURL(url)
  }, [file])
  if (!src) return null
  return <img src={src} alt={file.name} className="h-full w-full object-cover" />
})

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Modal para subir evidencias del trabajo (fotos, videos o PDF). Cada archivo se
 * sube a Cloudinary vía el backend (`/api/v1/uploads`) y luego se registra como
 * evidencia del servicio. Soporta arrastrar-y-soltar y varios archivos a la vez.
 */
export function EvidenciaUploader({
  idServicio,
  open,
  onClose,
}: {
  idServicio: string | null
  open: boolean
  onClose: () => void
}) {
  const subidoPor = useAuthStore((s) => s.user?.idUsuario)
  const crear = useCrearEvidencia()
  const [files, setFiles] = useState<File[]>([])
  const [descripcion, setDescripcion] = useState("")
  const [dragging, setDragging] = useState(false)
  const [subiendo, setSubiendo] = useState(false)
  const [progreso, setProgreso] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) {
      setFiles([])
      setDescripcion("")
      setDragging(false)
      setProgreso(0)
    }
  }, [open])

  const agregar = (lista?: FileList | null) => {
    if (!lista?.length) return
    const validos: File[] = []
    for (const f of Array.from(lista)) {
      if (!tipoDe(f)) {
        toast.error(`"${f.name}": formato no soportado (usa imagen, video o PDF).`)
        continue
      }
      if (f.size > MAX_BYTES) {
        toast.error(`"${f.name}" supera el máximo de 15 MB.`)
        continue
      }
      validos.push(f)
    }
    if (validos.length) setFiles((prev) => [...prev, ...validos])
  }

  const quitar = (i: number) => setFiles((prev) => prev.filter((_, idx) => idx !== i))

  const subir = async () => {
    if (!idServicio || !subidoPor || files.length === 0) return
    setSubiendo(true)
    setProgreso(0)
    let ok = 0
    try {
      for (const file of files) {
        const tipo = tipoDe(file)
        if (!tipo) continue
        const url = await uploadsApi.file(file)
        await crear.mutateAsync({
          idServicio,
          urlArchivo: url,
          nombreArchivo: file.name,
          tipoArchivo: tipo,
          tamanoBytes: file.size,
          descripcion: descripcion.trim() || undefined,
          subidoPor,
        })
        ok += 1
        setProgreso(ok)
      }
      toast.success(ok === 1 ? "Evidencia subida" : `${ok} evidencias subidas`)
      onClose()
    } catch {
      toast.error(
        ok > 0
          ? `Se subieron ${ok} de ${files.length}. Reintenta las restantes.`
          : "No se pudieron subir las evidencias.",
      )
      // Conserva solo las que faltaron para reintentar.
      setFiles((prev) => prev.slice(ok))
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={subiendo ? () => {} : onClose}
      title="Subir evidencias"
      description="Documenta el trabajo con fotos, videos o PDF. Se guardan de forma segura."
    >
      <div className="space-y-5">
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
            agregar(e.dataTransfer.files)
          }}
          className={cn(
            "flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition-colors",
            dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
          )}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileUp className="h-5 w-5" />
          </span>
          <p className="text-sm font-medium">Arrastra archivos aquí o haz clic para elegir</p>
          <p className="text-xs text-muted-foreground">Imagen, video o PDF · máx. 15 MB c/u</p>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            multiple
            className="hidden"
            onChange={(e) => {
              agregar(e.target.files)
              e.target.value = ""
            }}
          />
        </div>

        {/* Lista de archivos elegidos */}
        {files.length > 0 && (
          <ul className="space-y-2">
            {files.map((f, i) => {
              const tipo = tipoDe(f)!
              return (
                <li
                  key={`${f.name}-${i}`}
                  className="flex items-center gap-3 rounded-xl border border-border p-2.5"
                >
                  {tipo === "IMAGEN" ? (
                    <span className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                      <ImagePreview file={f} />
                    </span>
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <IconoTipo tipo={tipo} className="h-4 w-4" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{f.name}</p>
                    <p className="text-xs text-muted-foreground">{formatBytes(f.size)}</p>
                  </div>
                  {!subiendo && (
                    <button
                      type="button"
                      onClick={() => quitar(i)}
                      className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label={`Quitar ${f.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        <div className="space-y-2">
          <Label htmlFor="evidencia-desc">Descripción (opcional)</Label>
          <Textarea
            id="evidencia-desc"
            rows={2}
            maxLength={500}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej.: Antes y después de la reparación"
            disabled={subiendo}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            {subiendo
              ? `Subiendo ${progreso}/${files.length}…`
              : files.length > 0
                ? `${files.length} archivo${files.length > 1 ? "s" : ""} listo${files.length > 1 ? "s" : ""}`
                : ""}
          </span>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={subiendo}>
              Cancelar
            </Button>
            <Button type="button" onClick={subir} disabled={files.length === 0 || subiendo}>
              {subiendo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {subiendo ? "Subiendo…" : "Subir"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
