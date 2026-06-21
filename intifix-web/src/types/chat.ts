export type TipoMensaje = "TEXTO" | "IMAGEN" | "VIDEO" | "AUDIO" | "PDF"

export interface Adjunto {
  url: string
  nombreArchivo: string
  tipoMime: string
  tamanoBytes?: number
}

export interface Mensaje {
  idMensaje: string
  idConversacion: string
  tipo: TipoMensaje
  contenido?: string
  adjunto?: Adjunto
  idMensajeRespondido?: string
  // sender id — field name varies across DTOs
  idRemitente?: string
  idEmisor?: string
  idUsuario?: string
  leido?: boolean
  editado?: boolean
  fecha?: string
  fechaCreacion?: string
  // local-only flag for optimistic messages awaiting server echo
  _optimistic?: boolean
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

/* ---- Accessors ---- */
export const mensajeRemitente = (m: Mensaje): string | undefined =>
  m.idRemitente ?? m.idEmisor ?? m.idUsuario
export const mensajeFecha = (m: Mensaje): string | undefined => m.fecha ?? m.fechaCreacion
