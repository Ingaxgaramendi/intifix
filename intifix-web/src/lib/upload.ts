import type { Adjunto } from "@/types/chat"
import { useAuthStore } from "@/stores/auth-store"

/**
 * Subida de adjuntos del chat. Todos los archivos pasan por el backend
 * (`/api/v1/uploads`), que a su vez los sube a Cloudinary — igual que las fotos
 * de perfil y de servicios. Así no hay nada local ni config de Cloudinary en el front.
 */

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8080"

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024 // 15 MB

/** Saca la URL pública de la respuesta ApiResponse<{url}> (tolera secure_url/data.url). */
function extractUrl(body: unknown): string | null {
  if (!body || typeof body !== "object") return null
  const o = body as Record<string, unknown>
  const direct = (o.secure_url ?? o.url ?? o.fileUrl ?? o.location) as string | undefined
  if (direct) return direct
  const data = o.data as Record<string, unknown> | undefined
  if (data) return ((data.secure_url ?? data.url ?? data.fileUrl ?? data.location) as string) ?? null
  return null
}

/**
 * Sube un archivo por el backend y resuelve con el Adjunto que necesita el chat.
 * `onProgress` reporta 0–100 (usa XHR para tener eventos de progreso).
 */
export function uploadChatFile(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<Adjunto> {
  if (file.size > MAX_UPLOAD_BYTES) {
    return Promise.reject(new Error("El archivo supera el máximo de 15 MB."))
  }

  const token = useAuthStore.getState().accessToken
  const form = new FormData()
  form.append("file", file)

  return new Promise<Adjunto>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("POST", `${BASE_URL}/api/v1/uploads`)
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onerror = () => reject(new Error("No se pudo subir el archivo (red)."))
    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(`Error al subir (${xhr.status}).`))
        return
      }
      let parsed: unknown
      try {
        parsed = JSON.parse(xhr.responseText)
      } catch {
        parsed = xhr.responseText?.startsWith("http") ? { url: xhr.responseText.trim() } : null
      }
      const url = extractUrl(parsed)
      if (!url) {
        reject(new Error("La respuesta del servidor no incluye la URL del archivo."))
        return
      }
      resolve({
        url,
        nombreArchivo: file.name,
        tipoMime: file.type || "application/octet-stream",
        tamanoBytes: file.size,
      })
    }
    xhr.send(form)
  })
}
