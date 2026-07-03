import { FileText, Film, Image as ImageIcon } from "lucide-react"
import type { Evidencia } from "@/types/service"

/**
 * Cuadrícula de evidencias del servicio. Las imágenes se muestran como miniatura;
 * videos y PDF como ícono con su nombre. La descripción aparece al pasar el cursor.
 * Cada elemento abre el archivo (Cloudinary) en una pestaña nueva.
 */
export function EvidenciaGallery({ evidencias }: { evidencias: Evidencia[] }) {
  if (!evidencias.length) return null
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {evidencias.map((e) => {
        const tipo = (e.tipoArchivo ?? "").toUpperCase()
        const esImagen = tipo === "IMAGEN" && !!e.urlArchivo
        return (
          <a
            key={e.idEvidencia}
            href={e.urlArchivo}
            target="_blank"
            rel="noreferrer"
            className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted transition-colors hover:border-primary/30"
            title={e.descripcion ?? e.nombreArchivo ?? "Evidencia"}
          >
            {esImagen ? (
              <img
                src={e.urlArchivo}
                alt={e.descripcion ?? "Evidencia"}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <span className="flex h-full flex-col items-center justify-center gap-1.5 px-2 text-center text-muted-foreground">
                {tipo === "VIDEO" ? (
                  <Film className="h-7 w-7" />
                ) : tipo === "PDF" ? (
                  <FileText className="h-7 w-7" />
                ) : (
                  <ImageIcon className="h-7 w-7" />
                )}
                <span className="line-clamp-2 text-xs">{e.nombreArchivo ?? tipo}</span>
              </span>
            )}
            {e.descripcion && (
              <span className="absolute inset-x-0 bottom-0 line-clamp-2 bg-gradient-to-t from-black/75 to-transparent px-2 pb-1.5 pt-4 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                {e.descripcion}
              </span>
            )}
          </a>
        )
      })}
    </div>
  )
}
