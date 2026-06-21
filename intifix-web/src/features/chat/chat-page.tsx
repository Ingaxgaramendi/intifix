import { useEffect, useRef, useState } from "react"
import { Send, ArrowLeft, MessageSquare, Loader2, Wifi, WifiOff } from "lucide-react"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { mensajeFecha, mensajeRemitente, type Conversacion, type Mensaje } from "@/types/chat"
import { useConversaciones, useEnviarMensaje, useMarcarLeidos, useMensajes } from "./use-chat"
import { useChatSocket } from "./use-chat-socket"

const contactName = (c: Conversacion) =>
  c.nombreContacto ?? c.tituloServicio ?? `Conversación ${c.idConversacion.slice(0, 6)}`

const timeOf = (iso?: string) => {
  if (!iso) return ""
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })
}

/* ----------------------------- Conversation list ------------------------- */

function ConversationItem({
  c,
  active,
  onClick,
}: {
  c: Conversacion
  active: boolean
  onClick: () => void
}) {
  const name = contactName(c)
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors",
        active ? "bg-primary/10" : "hover:bg-muted",
      )}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
        {name.slice(0, 2).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-medium">{name}</p>
          <span className="shrink-0 text-xs text-muted-foreground">{timeOf(c.fechaUltimoMensaje)}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm text-muted-foreground">{c.ultimoMensaje ?? "Sin mensajes"}</p>
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

/* --------------------------------- Bubble -------------------------------- */

function MessageBubble({ m, mine, lastMine }: { m: Mensaje; mine: boolean; lastMine: boolean }) {
  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-3.5 py-2",
          mine ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-muted",
          m._optimistic && "opacity-70",
        )}
      >
        {m.contenido && <p className="whitespace-pre-wrap break-words text-sm">{m.contenido}</p>}
        {m.adjunto && (
          <a
            href={m.adjunto.url}
            target="_blank"
            rel="noreferrer"
            className="text-sm underline underline-offset-2"
          >
            {m.adjunto.nombreArchivo}
          </a>
        )}
        <div className={cn("mt-0.5 flex items-center justify-end gap-1 text-[10px]", mine ? "text-primary-foreground/70" : "text-muted-foreground")}>
          <span>{timeOf(mensajeFecha(m))}</span>
          {mine && lastMine && <span>· {m.leido ? "Leído" : "Enviado"}</span>}
        </div>
      </div>
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
  onBack,
}: {
  conversacion: Conversacion
  myId?: string
  socketConnected: boolean
  typing: boolean
  onTyping: (escribiendo: boolean) => void
  onBack: () => void
}) {
  const idConv = conversacion.idConversacion
  const { data: mensajes = [], isLoading } = useMensajes(idConv, socketConnected)
  const enviar = useEnviarMensaje(idConv)
  const [text, setText] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [mensajes.length])

  const lastMineId = [...mensajes].reverse().find((m) => mensajeRemitente(m) === myId)?.idMensaje

  const handleChange = (v: string) => {
    setText(v)
    onTyping(true)
    if (typingTimer.current) clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => onTyping(false), 1500)
  }

  const submit = () => {
    const contenido = text.trim()
    if (!contenido) return
    enviar.mutate({ idConversacion: idConv, tipo: "TEXTO", contenido })
    setText("")
    onTyping(false)
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border p-4">
        <button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted lg:hidden">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
          {contactName(conversacion).slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{contactName(conversacion)}</p>
          <p className="text-xs text-muted-foreground">
            {typing ? "escribiendo…" : conversacion.tituloServicio ?? "Servicio"}
          </p>
        </div>
        <span
          className={cn("inline-flex items-center gap-1 text-xs", socketConnected ? "text-success" : "text-muted-foreground")}
          title={socketConnected ? "Tiempo real" : "Modo sin conexión (polling)"}
        >
          {socketConnected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className={cn("h-10 rounded-2xl", i % 2 ? "ml-auto w-1/2" : "w-2/3")} />
            ))}
          </div>
        ) : mensajes.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Envía el primer mensaje 👋
          </div>
        ) : (
          mensajes.map((m) => (
            <MessageBubble
              key={m.idMensaje}
              m={m}
              mine={mensajeRemitente(m) === myId}
              lastMine={m.idMensaje === lastMineId}
            />
          ))
        )}
        {typing && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md bg-muted px-3.5 py-2 text-sm text-muted-foreground">escribiendo…</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="flex items-center gap-2 border-t border-border p-3">
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
          className="h-11 flex-1 rounded-full border border-input bg-transparent px-4 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
        />
        <Button
          size="icon"
          className="h-11 w-11 rounded-full"
          onClick={submit}
          disabled={!text.trim() || enviar.isPending}
          aria-label="Enviar"
        >
          {enviar.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </Button>
      </div>
    </div>
  )
}

/* ---------------------------------- Page --------------------------------- */

export function ChatPage() {
  const myId = useAuthStore((s) => s.user?.idUsuario)
  const { data: conversaciones = [], isLoading } = useConversaciones()
  const { connected, typingByConv, sendRead, sendTyping } = useChatSocket()
  const marcarLeidos = useMarcarLeidos()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selected = conversaciones.find((c) => c.idConversacion === selectedId) ?? null

  // On opening a conversation, mark it read locally + notify the other party.
  useEffect(() => {
    if (!selectedId) return
    marcarLeidos.mutate(selectedId)
    sendRead(selectedId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  return (
    <div className="h-[calc(100vh-7rem)] overflow-hidden rounded-2xl border border-border bg-card">
      <div className="grid h-full lg:grid-cols-[340px_1fr]">
        {/* Conversation list */}
        <div className={cn("flex h-full flex-col border-r border-border", selected && "hidden lg:flex")}>
          <div className="border-b border-border p-4">
            <h1 className="text-lg font-semibold">Mensajes</h1>
          </div>
          <div className="flex-1 space-y-1 overflow-y-auto p-2">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)
            ) : conversaciones.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <MessageSquare className="h-7 w-7" />
                </span>
                <p className="mt-4 font-medium">Sin conversaciones</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Las conversaciones se crean desde un servicio.
                </p>
              </div>
            ) : (
              conversaciones.map((c) => (
                <ConversationItem
                  key={c.idConversacion}
                  c={c}
                  active={c.idConversacion === selectedId}
                  onClick={() => setSelectedId(c.idConversacion)}
                />
              ))
            )}
          </div>
        </div>

        {/* Thread */}
        <div className={cn("h-full", !selected && "hidden lg:block")}>
          {selected ? (
            <Thread
              conversacion={selected}
              myId={myId}
              socketConnected={connected}
              typing={!!typingByConv[selected.idConversacion]}
              onTyping={(esc) => sendTyping(selected.idConversacion, esc)}
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
