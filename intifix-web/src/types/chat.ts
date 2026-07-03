export type TipoMensaje = "TEXTO" | "IMAGEN" | "VIDEO" | "AUDIO" | "PDF"

/** Delivery state, WhatsApp-style: ENVIADO (✓), RECIBIDO (✓✓), LEIDO (✓✓ azul). */
export type EstadoMensaje = "ENVIADO" | "RECIBIDO" | "LEIDO"

export interface Adjunto {
  url: string
  nombreArchivo: string
  tipoMime: string
  tamanoBytes?: number
}

export interface Mensaje {
  // The backend MensajeResponse uses `id`; older code/DTOs used `idMensaje`.
  id?: string
  idMensaje?: string
  idConversacion: string
  tipo: TipoMensaje
  contenido?: string
  adjunto?: Adjunto
  idMensajeRespondido?: string
  estado?: EstadoMensaje
  // sender id — field name varies across DTOs
  idRemitente?: string
  idEmisor?: string
  idUsuario?: string
  leido?: boolean
  editado?: boolean
  eliminado?: boolean
  leidoEn?: string
  fecha?: string
  fechaCreacion?: string
  creadoEn?: string
  // local-only flags for optimistic messages awaiting server echo
  _optimistic?: boolean
  _failed?: boolean
  [key: string]: unknown
}

export interface Conversacion {
  idConversacion: string
  idServicio?: string
  idCliente?: string
  idTecnico?: string
  nombreContacto?: string
  tituloServicio?: string
  ultimoMensaje?: string
  noLeidos?: number
  archivada?: boolean
  bloqueada?: boolean
  fechaUltimoMensaje?: string
  [key: string]: unknown
}

/** POST /api/v1/chat/mensajes (and /app/chat.send). */
export interface CreateMensajeRequest {
  idConversacion: string
  tipo: TipoMensaje
  contenido?: string
  adjunto?: Adjunto
  idMensajeRespondido?: string
}

export interface CrearConversacionRequest {
  idServicio: string
}

/* ---- STOMP server→client events ---- */
export interface ChatReadEvent {
  idConversacion: string
  idUsuario: string
  fecha?: string
}
export interface ChatTypingEvent {
  idConversacion: string
  idUsuario: string
  escribiendo: boolean
}
export interface ChatDeliveredEvent {
  idConversacion: string
  idUsuario: string
  fecha?: string
}

/* ---- Accessors ---- */
/** Conversation id, tolerating alternate backend field names. */
export const conversacionId = (c: Conversacion): string =>
  (c.idConversacion ?? (c.id as string | undefined) ?? (c._id as string | undefined) ?? "")

/** Last-message preview text. The backend may send `ultimoMensaje` as a string
 *  OR as an object { preview, contenido, fecha, ... } — handle both. */
export const conversacionPreview = (c: Conversacion): string => {
  const u = c.ultimoMensaje as unknown
  if (!u) return "Sin mensajes"
  if (typeof u === "string") return u
  if (typeof u === "object") {
    const o = u as Record<string, unknown>
    return (o.preview as string) ?? (o.contenido as string) ?? "Mensaje"
  }
  return "Mensaje"
}

/** Timestamp of the last message, from the flat field or the nested object. */
export const conversacionFecha = (c: Conversacion): string | undefined => {
  if (c.fechaUltimoMensaje) return c.fechaUltimoMensaje
  const u = c.ultimoMensaje as unknown
  if (u && typeof u === "object") return (u as Record<string, unknown>).fecha as string | undefined
  return undefined
}

export const mensajeRemitente = (m: Mensaje): string | undefined =>
  m.idRemitente ?? m.idEmisor ?? m.idUsuario
export const mensajeFecha = (m: Mensaje): string | undefined =>
  m.fecha ?? m.fechaCreacion ?? m.creadoEn
/** Stable message id, tolerating `id` (backend) vs `idMensaje` (legacy). */
export const mensajeId = (m: Mensaje): string =>
  (m.idMensaje ?? m.id ?? (m._id as string | undefined) ?? "")
/** Delivery state with a sane fallback for messages predating the field. */
export const mensajeEstado = (m: Mensaje): EstadoMensaje =>
  m.estado ?? (m.leido ? "LEIDO" : "ENVIADO")

/* ---- Attachment helpers ---- */
export const esImagen = (m: Mensaje): boolean =>
  m.tipo === "IMAGEN" || (m.adjunto?.tipoMime?.startsWith("image/") ?? false)
export const esVideo = (m: Mensaje): boolean =>
  m.tipo === "VIDEO" || (m.adjunto?.tipoMime?.startsWith("video/") ?? false)
export const esAudio = (m: Mensaje): boolean =>
  m.tipo === "AUDIO" || (m.adjunto?.tipoMime?.startsWith("audio/") ?? false)

/** Maps a File's MIME type to the backend TipoMensaje enum. */
export const tipoDeArchivo = (mime: string): TipoMensaje => {
  if (mime.startsWith("image/")) return "IMAGEN"
  if (mime.startsWith("video/")) return "VIDEO"
  if (mime.startsWith("audio/")) return "AUDIO"
  if (mime === "application/pdf") return "PDF"
  return "PDF"
}
