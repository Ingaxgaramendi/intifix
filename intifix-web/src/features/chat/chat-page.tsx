import { Fragment, useEffect, useRef, useState } from "react"
import { useParams } from "react-router-dom"
import {
  Send,
  ArrowLeft,
  MessageSquare,
  Loader2,
  Wifi,
  WifiOff,
  MoreVertical,
  Archive,
  Ban,
  Trash2,
  Pencil,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  X,
  Paperclip,
  FileText,
  Download,
  Search,
  ChevronDown,
} from "lucide-react"
import { toast } from "sonner"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PerfilLink } from "@/components/shared/perfil-link"
import { paths } from "@/routes/paths"
import { cn } from "@/lib/utils"
import { uploadChatFile } from "@/lib/upload"
import {
  conversacionFecha,
  conversacionPreview,
  esAudio,
  esImagen,
  esVideo,
  mensajeEstado,
  mensajeFecha,
  mensajeId,
  mensajeRemitente,
  tipoDeArchivo,
  type Conversacion,
  type Mensaje,
} from "@/types/chat"
import { useClienteMini, useServicioTitulo, useTecnicoMini } from "@/features/services/use-services"
import { UserAvatar } from "@/components/shared/user-avatar"
import {
  useArchivarConversacion,
  useBloquearConversacion,
  useCargarAnteriores,
  useConversaciones,
  useDesarchivarConversacion,
  useDesbloquearConversacion,
  useEditarMensaje,
  useEliminarConversacion,
  useEliminarMensaje,
  useEnviarMensaje,
  useMarcarLeidos,
  useMensajes,
} from "./use-chat"
import { useChatSocket } from "./use-chat-socket"

/** Display label for a conversation — never an id, and always the OTHER party:
 *  a technician sees the client (or service title); a client sees the technician. */
function useConversacionLabel(c: Conversacion): { name: string; subtitle: string; foto: string | null } {
  const roles = useAuthStore((s) => s.user?.roles)
  const esTecnico = roles?.includes("TECNICO") ?? false
  const { data: titulo } = useServicioTitulo(c.idServicio)
  const tecnico = useTecnicoMini(esTecnico ? undefined : c.idTecnico)
  const cliente = useClienteMini(esTecnico ? c.idCliente : undefined)
  const contacto = esTecnico ? cliente.data : tecnico.data
  const name = c.nombreContacto ?? contacto?.nombre ?? c.tituloServicio ?? titulo ?? "Conversación"
  const subtitle = c.tituloServicio ?? titulo ?? "Servicio"
  return { name, subtitle, foto: contacto?.foto ?? null }
}

/* ------------------------------- date helpers ---------------------------- */

const timeOf = (iso?: string) => {
  if (!iso) return ""
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })
}

const sameDay = (a?: string, b?: string) => {
  if (!a || !b) return false
  const da = new Date(a)
  const db = new Date(b)
  return !Number.isNaN(da.getTime()) && da.toDateString() === db.toDateString()
}

function dayLabel(iso?: string): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return "Hoy"
  if (d.toDateString() === yesterday.toDateString()) return "Ayer"
  return d.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "long",
    ...(d.getFullYear() !== today.getFullYear() ? { year: "numeric" } : {}),
  })
}

/* ----------------------------- Conversation list ------------------------- */

function ConversationItem({ c, active, onClick }: { c: Conversacion; active: boolean; onClick: () => void }) {
  const { name, foto } = useConversacionLabel(c)
  const isArchivada = !!c.archivada
  const isBloqueada = !!c.bloqueada
  const isDimmed = isArchivada || isBloqueada
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors",
        active ? "bg-primary/10" : "hover:bg-muted",
        isDimmed && "opacity-60",
      )}
    >
      <UserAvatar nombre={name} fotoUrl={foto} size={44} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-medium">{name}</p>
          <div className="flex shrink-0 items-center gap-1">
            {isArchivada && <Archive className="h-3 w-3 text-muted-foreground" />}
            {isBloqueada && <Ban className="h-3 w-3 text-muted-foreground" />}
            <span className="text-xs text-muted-foreground">{timeOf(conversacionFecha(c))}</span>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm text-muted-foreground">{conversacionPreview(c)}</p>
          {!!c.noLeidos && c.noLeidos > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
              {c.noLeidos}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

/* ------------------------------ delivery ticks --------------------------- */

function StatusTicks({ m }: { m: Mensaje }) {
  if (m._failed) return <AlertCircle className="h-3.5 w-3.5 text-destructive" />
  if (m._optimistic) return <Clock className="h-3 w-3 opacity-70" />
  const estado = mensajeEstado(m)
  if (estado === "LEIDO") return <CheckCheck className="h-3.5 w-3.5 text-sky-400" />
  if (estado === "RECIBIDO") return <CheckCheck className="h-3.5 w-3.5 opacity-70" />
  return <Check className="h-3.5 w-3.5 opacity-70" />
}

/* ------------------------------- attachments ----------------------------- */

function Attachment({ m, mine, onZoom }: { m: Mensaje; mine: boolean; onZoom: (url: string) => void }) {
  const a = m.adjunto
  if (!a) return null

  if (esImagen(m)) {
    return (
      <button
        onClick={() => onZoom(a.url)}
        className="block overflow-hidden rounded-lg"
        aria-label="Ampliar imagen"
      >
        <img
          src={a.url}
          alt={a.nombreArchivo}
          loading="lazy"
          className="max-h-80 w-full max-w-[260px] object-cover"
        />
      </button>
    )
  }
  if (esVideo(m)) {
    return <video src={a.url} controls className="max-h-80 max-w-[260px] rounded-lg" />
  }
  if (esAudio(m)) {
    return <audio src={a.url} controls className="w-[240px]" />
  }
  // PDF / otros: tarjeta con descarga.
  return (
    <a
      href={a.url}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "flex items-center gap-3 rounded-lg p-2",
        mine ? "bg-primary-foreground/10" : "bg-background",
      )}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
        <FileText className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{a.nombreArchivo}</span>
        <span className="text-xs opacity-70">
          {a.tamanoBytes ? `${(a.tamanoBytes / 1024 / 1024).toFixed(1)} MB` : "Archivo"}
        </span>
      </span>
      <Download className="ml-auto h-4 w-4 shrink-0 opacity-70" />
    </a>
  )
}

/* --------------------------------- Bubble -------------------------------- */

function MessageBubble({
  m,
  mine,
  grouped,
  onEdit,
  onDelete,
  onZoom,
  saving,
}: {
  m: Mensaje
  mine: boolean
  grouped: boolean
  onEdit: (contenido: string) => void
  onDelete: () => void
  onZoom: (url: string) => void
  saving: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(m.contenido ?? "")
  const realId = !m._optimistic && !mensajeId(m).startsWith("temp-") && !!mensajeId(m)
  const esTexto = m.tipo === "TEXTO" && !!m.contenido
  const canEdit = mine && realId && esTexto && !m._failed
  const canDelete = mine && realId && !m._failed

  const save = () => {
    const v = draft.trim()
    if (!v || v === m.contenido) {
      setEditing(false)
      return
    }
    onEdit(v)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex justify-end">
        <div className="flex w-full max-w-[80%] items-center gap-2">
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                save()
              } else if (e.key === "Escape") {
                setDraft(m.contenido ?? "")
                setEditing(false)
              }
            }}
            className="h-10 flex-1 rounded-full border border-input bg-transparent px-4 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <button
            onClick={save}
            aria-label="Guardar"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setDraft(m.contenido ?? "")
              setEditing(false)
            }}
            aria-label="Cancelar"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  const media = !!m.adjunto && !esTexto

  return (
    <div
      className={cn(
        "group flex items-center gap-1.5",
        mine ? "justify-end" : "justify-start",
        grouped ? "mt-0.5" : "mt-2",
      )}
    >
      {(canEdit || canDelete) && (
        <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          {canEdit && (
            <button
              onClick={() => {
                setDraft(m.contenido ?? "")
                setEditing(true)
              }}
              aria-label="Editar mensaje"
              className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          {canDelete && (
            <button
              onClick={onDelete}
              disabled={saving}
              aria-label="Eliminar mensaje"
              className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
      <div
        className={cn(
          "max-w-[78%] shadow-sm sm:max-w-[65%]",
          media ? "overflow-hidden rounded-2xl p-1" : "rounded-2xl px-3 py-2",
          mine ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-card border border-border",
          m._optimistic && "opacity-70",
          m._failed && "ring-1 ring-destructive",
        )}
      >
        {media && <Attachment m={m} mine={mine} onZoom={onZoom} />}
        {m.contenido && (
          <p className={cn("whitespace-pre-wrap break-words text-sm", media && "px-2 pt-1")}>{m.contenido}</p>
        )}
        <div
          className={cn(
            "flex items-center justify-end gap-1 text-[10px]",
            media ? "px-2 pb-1 pt-0.5" : "mt-0.5",
            mine ? "text-primary-foreground/70" : "text-muted-foreground",
          )}
        >
          {m.editado && <span className="italic">editado</span>}
          <span>{timeOf(mensajeFecha(m))}</span>
          {mine && <StatusTicks m={m} />}
        </div>
      </div>
    </div>
  )
}

/* ----------------------------- conversation menu ------------------------- */

function ConversationMenu({
  archivada,
  bloqueada,
  onArchivar,
  onDesarchivar,
  onBloquear,
  onDesbloquear,
  onEliminar,
}: {
  archivada: boolean
  bloqueada: boolean
  onArchivar: () => void
  onDesarchivar: () => void
  onBloquear: () => void
  onDesbloquear: () => void
  onEliminar: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [open])

  const run = (fn: () => void) => () => {
    setOpen(false)
    fn()
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Opciones de la conversación"
        className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <MoreVertical className="h-5 w-5" />
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-20 w-52 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-lg">
          {archivada ? (
            <button onClick={run(onDesarchivar)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-muted">
              <Archive className="h-4 w-4" />
              Desarchivar
            </button>
          ) : (
            <button onClick={run(onArchivar)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-muted">
              <Archive className="h-4 w-4" />
              Archivar
            </button>
          )}
          {bloqueada ? (
            <button onClick={run(onDesbloquear)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-muted">
              <Ban className="h-4 w-4" />
              Desbloquear
            </button>
          ) : (
            <button onClick={run(onBloquear)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-muted">
              <Ban className="h-4 w-4" />
              Bloquear
            </button>
          )}
          <button onClick={run(onEliminar)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-destructive transition-colors hover:bg-destructive/10">
            <Trash2 className="h-4 w-4" />
            Eliminar
          </button>
        </div>
      )}
    </div>
  )
}

/* --------------------------------- Composer ------------------------------ */

function Composer({
  onSend,
  onSendFile,
  onTyping,
}: {
  onSend: (text: string) => void
  onSendFile: (file: File) => void
  onTyping: (escribiendo: boolean) => void
}) {
  const [text, setText] = useState("")
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleChange = (v: string) => {
    setText(v)
    onTyping(true)
    if (typingTimer.current) clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => onTyping(false), 1500)
  }

  const submit = () => {
    const contenido = text.trim()
    if (!contenido) return
    onSend(contenido)
    setText("")
    onTyping(false)
  }

  const pickFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        await Promise.resolve(onSendFile(file))
      }
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  return (
    <div className="flex shrink-0 items-center gap-1.5 border-t border-border p-2 sm:gap-2 sm:p-3">
      <input
        ref={fileRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*,application/pdf"
        className="hidden"
        onChange={(e) => void pickFiles(e.target.files)}
      />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        aria-label="Adjuntar archivo"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50 sm:h-11 sm:w-11"
      >
        {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5" />}
      </button>
      <input
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            submit()
          }
        }}
        placeholder="Escribe un mensaje…"
        className="h-10 min-w-0 flex-1 rounded-full border border-input bg-transparent px-4 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:h-11 sm:text-sm"
      />
      <Button
        size="icon"
        className="h-10 w-10 shrink-0 rounded-full sm:h-11 sm:w-11"
        onClick={submit}
        disabled={!text.trim()}
        aria-label="Enviar"
      >
        <Send className="h-5 w-5" />
      </Button>
    </div>
  )
}

/* --------------------------------- Thread -------------------------------- */

function Thread({
  conversacion,
  myId,
  socketConnected,
  typing,
  onTyping,
  onMarkRead,
  onBack,
}: {
  conversacion: Conversacion
  myId?: string
  socketConnected: boolean
  typing: boolean
  onTyping: (escribiendo: boolean) => void
  onMarkRead: (idConversacion: string) => void
  onBack: () => void
}) {
  const idConv = conversacion.idConversacion
  const { name: convName, subtitle: convSubtitle, foto: convFoto } = useConversacionLabel(conversacion)

  // Nombre del contacto → su perfil (estilo red social). El técnico ve al cliente
  // (área TECNICO) y el cliente ve al técnico (área CLIENTE).
  const esTecnico = useAuthStore((s) => s.user?.roles)?.includes("TECNICO") ?? false
  const perfilContacto = esTecnico
    ? conversacion.idCliente
      ? paths.tecnico.clientePerfil(conversacion.idCliente)
      : undefined
    : conversacion.idTecnico
      ? paths.cliente.tecnicoPerfil(conversacion.idTecnico)
      : undefined
  const perfilState = esTecnico ? { idServicio: conversacion.idServicio } : undefined
  const { data: mensajes = [], isLoading, isError, refetch } = useMensajes(idConv, socketConnected)
  const enviar = useEnviarMensaje(idConv)
  const editarMsg = useEditarMensaje(idConv)
  const eliminarMsg = useEliminarMensaje(idConv)
  const archivar = useArchivarConversacion()
  const desarchivar = useDesarchivarConversacion()
  const bloquear = useBloquearConversacion()
  const desbloquear = useDesbloquearConversacion()
  const eliminarConv = useEliminarConversacion()
  const isArchivada = !!conversacion.archivada
  const isBloqueada = !!conversacion.bloqueada
  const cargarAnteriores = useCargarAnteriores(idConv)

  const scrollRef = useRef<HTMLDivElement>(null)
  const atBottomRef = useRef(true)
  const loadingOlderRef = useRef(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [zoom, setZoom] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<"bloquear" | "eliminar" | null>(null)

  const mine = (m: Mensaje) => mensajeRemitente(m) === myId

  // Auto-scroll to the newest message only when the user is already at the bottom.
  useEffect(() => {
    const el = scrollRef.current
    if (el && atBottomRef.current) el.scrollTop = el.scrollHeight
  }, [mensajes.length])

  // Mark the thread read on open and whenever a new incoming message arrives.
  const lastIncomingId = [...mensajes].reverse().find((m) => !mine(m) && !m._optimistic)
  const lastIncoming = lastIncomingId ? mensajeId(lastIncomingId) : undefined
  useEffect(() => {
    if (!idConv || !lastIncoming) return
    onMarkRead(idConv)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idConv, socketConnected, lastIncoming])

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120
    if (el.scrollTop < 80 && hasMore && !loadingOlderRef.current) {
      loadingOlderRef.current = true
      const prevHeight = el.scrollHeight
      cargarAnteriores.mutate(page, {
        onSuccess: ({ hasMore: hm }) => {
          setPage((p) => p + 1)
          setHasMore(hm)
          requestAnimationFrame(() => {
            const el2 = scrollRef.current
            if (el2) el2.scrollTop = el2.scrollHeight - prevHeight
          })
        },
        onSettled: () => {
          loadingOlderRef.current = false
        },
      })
    }
  }

  const send = (contenido: string) => {
    atBottomRef.current = true
    enviar.mutate({ idConversacion: idConv, tipo: "TEXTO", contenido })
    onTyping(false)
  }

  const sendFile = async (file: File) => {
    try {
      const adjunto = await uploadChatFile(file)
      atBottomRef.current = true
      enviar.mutate({ idConversacion: idConv, tipo: tipoDeArchivo(file.type), adjunto })
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border p-4">
        <button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted lg:hidden">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <PerfilLink to={perfilContacto} state={perfilState} className="shrink-0 rounded-full">
          <UserAvatar nombre={convName} fotoUrl={convFoto} size={40} />
        </PerfilLink>
        <div className="min-w-0 flex-1">
          <PerfilLink to={perfilContacto} state={perfilState} className="block truncate font-semibold text-foreground hover:text-primary">
            {convName}
          </PerfilLink>
          <p className="truncate text-xs text-muted-foreground">{typing ? "escribiendo…" : convSubtitle}</p>
        </div>
        <span
          className={cn("inline-flex items-center gap-1 text-xs", socketConnected ? "text-success" : "text-muted-foreground")}
          title={socketConnected ? "Tiempo real" : "Modo sin conexión (polling)"}
        >
          {socketConnected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
        </span>
        <ConversationMenu
          archivada={isArchivada}
          bloqueada={isBloqueada}
          onArchivar={() => archivar.mutate(idConv)}
          onDesarchivar={() => desarchivar.mutate(idConv)}
          onBloquear={() => setPendingAction("bloquear")}
          onDesbloquear={() => desbloquear.mutate(idConv)}
          onEliminar={() => setPendingAction("eliminar")}
        />
      </div>

      {/* Status banner for archived / blocked threads */}
      {(isArchivada || isBloqueada) && !pendingAction && (
        <div className="shrink-0 flex items-center justify-between gap-3 border-b border-border bg-muted/40 px-4 py-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            {isArchivada ? <Archive className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
            <span>{isArchivada ? "Conversación archivada" : "Conversación bloqueada"}</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-3 text-xs"
            onClick={() => isArchivada ? desarchivar.mutate(idConv) : desbloquear.mutate(idConv)}
          >
            {isArchivada ? "Desarchivar" : "Desbloquear"}
          </Button>
        </div>
      )}

      {/* Inline confirmation banner — replaces window.confirm */}
      {pendingAction && (
        <div className="shrink-0 flex items-center justify-between gap-3 border-b border-border bg-muted/60 px-4 py-2.5 text-sm">
          <span className="text-foreground">
            {pendingAction === "bloquear"
              ? "¿Bloquear esta conversación?"
              : "¿Eliminar la conversación? No se puede deshacer."}
          </span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" className="h-7 px-3 text-xs" onClick={() => setPendingAction(null)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              variant={pendingAction === "eliminar" ? "destructive" : "default"}
              className="h-7 px-3 text-xs"
              onClick={() => {
                if (pendingAction === "bloquear") bloquear.mutate(idConv, { onSuccess: onBack })
                else eliminarConv.mutate(idConv, { onSuccess: onBack })
                setPendingAction(null)
              }}
            >
              {pendingAction === "bloquear" ? "Bloquear" : "Eliminar"}
            </Button>
          </div>
        </div>
      )}

      {/* Messages — min-h-0 lets this flex child shrink and scroll instead of
          pushing the composer out of the (overflow-hidden) container. */}
      <div ref={scrollRef} onScroll={handleScroll} className="chat-bg min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {cargarAnteriores.isPending && (
          <div className="flex justify-center py-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className={cn("h-10 rounded-2xl", i % 2 ? "ml-auto w-1/2" : "w-2/3")} />
            ))}
          </div>
        ) : isError ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p>No pudimos cargar los mensajes.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        ) : mensajes.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Envía el primer mensaje 👋
          </div>
        ) : (
          mensajes.map((m, i) => {
            const prev = mensajes[i - 1]
            const label = dayLabel(mensajeFecha(m))
            const showDay = !!label && (!prev || !sameDay(mensajeFecha(prev), mensajeFecha(m)))
            const grouped = !showDay && !!prev && mensajeRemitente(prev) === mensajeRemitente(m)
            return (
              <Fragment key={mensajeId(m) || i}>
                {showDay && (
                  <div className="my-3 flex justify-center">
                    <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-sm">
                      {label}
                    </span>
                  </div>
                )}
                <MessageBubble
                  m={m}
                  mine={mine(m)}
                  grouped={grouped}
                  saving={editarMsg.isPending || eliminarMsg.isPending}
                  onEdit={(contenido) => editarMsg.mutate({ id: mensajeId(m), contenido })}
                  onDelete={() => eliminarMsg.mutate(mensajeId(m))}
                  onZoom={setZoom}
                />
              </Fragment>
            )
          })
        )}
        {typing && (
          <div className="mt-2 flex justify-start">
            <div className="rounded-2xl rounded-bl-md bg-card border border-border px-3.5 py-2 text-sm text-muted-foreground">
              escribiendo…
            </div>
          </div>
        )}
      </div>

      <Composer onSend={send} onSendFile={sendFile} onTyping={onTyping} />

      {/* Lightbox */}
      {zoom && (
        <button
          onClick={() => setZoom(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
          aria-label="Cerrar imagen"
        >
          <img src={zoom} alt="" className="max-h-full max-w-full rounded-lg object-contain" />
        </button>
      )}
    </div>
  )
}

/* ----------------------------- Searchable item --------------------------- */

function SearchableConversationItem({
  c,
  active,
  onClick,
  search,
}: {
  c: Conversacion
  active: boolean
  onClick: () => void
  search: string
}) {
  const { name } = useConversacionLabel(c)
  if (search && !name.toLowerCase().includes(search.toLowerCase())) return null
  return <ConversationItem c={c} active={active} onClick={onClick} />
}

/* ---------------------------------- Page --------------------------------- */

export function ChatPage() {
  const myId = useAuthStore((s) => s.user?.idUsuario)
  const { data: conversaciones = [], isLoading } = useConversaciones()
  const { connected, typingByConv, sendRead, sendTyping } = useChatSocket()
  const marcarLeidos = useMarcarLeidos()
  const { idConversacion: routeId } = useParams<{ idConversacion: string }>()
  const [selectedId, setSelectedId] = useState<string | null>(routeId ?? null)
  const [search, setSearch] = useState("")
  const [showArchivadas, setShowArchivadas] = useState(false)

  const activas = conversaciones.filter((c) => !c.archivada)
  const archivadas = conversaciones.filter((c) => c.archivada)

  // Deep-link: when the URL carries a conversation id, open that thread.
  useEffect(() => {
    if (routeId) setSelectedId(routeId)
  }, [routeId])

  const selected = conversaciones.find((c) => c.idConversacion === selectedId) ?? null

  // Single-channel mark-read to avoid a REST+STOMP race on the same Mongo doc.
  const markRead = (id: string) => {
    if (connected) sendRead(id)
    else marcarLeidos.mutate(id)
  }

  return (
    <div className="h-[calc(100dvh-8rem)] overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex h-full min-h-0">
        {/* Conversation list */}
        <div
          className={cn(
            "flex h-full min-h-0 w-full flex-col border-r border-border lg:w-[340px] lg:shrink-0",
            selected && "hidden lg:flex",
          )}
        >
          <div className="border-b border-border px-4 pt-4 pb-2">
            <h1 className="mb-2 text-lg font-semibold">Mensajes</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar conversación…"
                className="h-8 w-full rounded-lg border border-input bg-muted/40 pl-8 pr-8 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:bg-background"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)
            ) : conversaciones.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <MessageSquare className="h-7 w-7" />
                </span>
                <p className="mt-4 font-medium">Sin conversaciones</p>
                <p className="mt-1 text-sm text-muted-foreground">Las conversaciones se crean desde un servicio.</p>
              </div>
            ) : search ? (
              /* Search mode: filter across all conversations */
              conversaciones.map((c) => (
                <SearchableConversationItem
                  key={c.idConversacion}
                  c={c}
                  active={c.idConversacion === selectedId}
                  onClick={() => setSelectedId(c.idConversacion)}
                  search={search}
                />
              ))
            ) : (
              /* Normal mode: active list + archived folder */
              <>
                {activas.map((c) => (
                  <ConversationItem
                    key={c.idConversacion}
                    c={c}
                    active={c.idConversacion === selectedId}
                    onClick={() => setSelectedId(c.idConversacion)}
                  />
                ))}
                {activas.length === 0 && archivadas.length === 0 && (
                  <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <MessageSquare className="h-7 w-7" />
                    </span>
                    <p className="mt-4 font-medium">Sin conversaciones</p>
                    <p className="mt-1 text-sm text-muted-foreground">Las conversaciones se crean desde un servicio.</p>
                  </div>
                )}
                {archivadas.length > 0 && (
                  <div className="mt-1">
                    <button
                      onClick={() => setShowArchivadas((v) => !v)}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Archive className="h-3.5 w-3.5" />
                      <span>Archivados ({archivadas.length})</span>
                      <ChevronDown
                        className={cn("ml-auto h-3.5 w-3.5 transition-transform", showArchivadas && "rotate-180")}
                      />
                    </button>
                    {showArchivadas &&
                      archivadas.map((c) => (
                        <ConversationItem
                          key={c.idConversacion}
                          c={c}
                          active={c.idConversacion === selectedId}
                          onClick={() => setSelectedId(c.idConversacion)}
                        />
                      ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Thread */}
        <div className={cn("h-full min-h-0 min-w-0 flex-1", !selected && "hidden lg:block")}>
          {selected ? (
            <Thread
              key={selected.idConversacion}
              conversacion={selected}
              myId={myId}
              socketConnected={connected}
              typing={!!typingByConv[selected.idConversacion]}
              onTyping={(esc) => sendTyping(selected.idConversacion, esc)}
              onMarkRead={markRead}
              onBack={() => setSelectedId(null)}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
              <MessageSquare className="h-10 w-10" />
              <p className="mt-3">Selecciona una conversación</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
