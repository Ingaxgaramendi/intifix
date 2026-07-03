import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import {
  ArrowUp,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Copy,
  Check,
  Zap,
  WrenchIcon,
  Star,
  MessageCircle,
  ChevronRight,
} from "lucide-react"
import { Link } from "react-router-dom"
import { useAuthStore } from "@/stores/auth-store"
import { streamAiChat } from "@/api/ai"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

/* ─────────────── Types ─────────────── */

interface AiMessage {
  id: string
  role: "user" | "assistant"
  content: string
  streaming?: boolean
}

/* ─────────────── Conversation ID ─────────────── */

function getOrCreateConvId(userId: string) {
  const key = `inti-conv-${userId}`
  const v = localStorage.getItem(key)
  if (v) return v
  const id = crypto.randomUUID()
  localStorage.setItem(key, id)
  return id
}

function resetConvId(userId: string) {
  const id = crypto.randomUUID()
  localStorage.setItem(`inti-conv-${userId}`, id)
  return id
}

/* ─────────────── Suggested prompts ─────────────── */

const SUGERENCIAS_WELCOME = [
  { icon: Star, text: "¿Qué técnicos tienen mejor calificación?", color: "text-amber-500" },
  { icon: WrenchIcon, text: "Necesito un plomero urgente", color: "text-blue-500" },
  { icon: Zap, text: "Busca electricistas disponibles", color: "text-yellow-500" },
  { icon: MessageCircle, text: "¿Qué categorías de servicio hay?", color: "text-primary" },
] as const

function getSuggestionsForMessage(content: string): string[] {
  const lower = content.toLowerCase()
  if (lower.includes("técnico") || lower.includes("tecnico") || lower.includes("nombre")) {
    return ["Ver más técnicos de esta categoría", "¿Cómo contacto a este técnico?", "¿Cuánto cobran por hora?"]
  }
  if (lower.includes("categor") || lower.includes("especialidad")) {
    return ["Plomería urgente", "Electricistas disponibles ahora", "Reparación de electrodomésticos"]
  }
  if (lower.includes("precio") || lower.includes("tarifa") || lower.includes("costo")) {
    return ["¿Hay técnicos más económicos?", "¿Cómo funciona el pago?", "¿Puedo negociar el precio?"]
  }
  return ["¿Qué más puedes hacer?", "Buscar técnicos mejor calificados", "¿Cómo solicito un servicio?"]
}

/* ─────────────── Markdown renderer ─────────────── */

function renderInline(text: string): ReactNode[] {
  // Split on **bold**, *italic*, and [text](url) links
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
    if (part.startsWith("*") && part.endsWith("*"))
      return <em key={i}>{part.slice(1, -1)}</em>
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (linkMatch) {
      const [, label, href] = linkMatch
      if (href.startsWith("/"))
        return <Link key={i} to={href} className="font-medium text-primary underline underline-offset-2 hover:text-primary/80 transition-colors">{label}</Link>
      return <a key={i} href={href} target="_blank" rel="noreferrer" className="font-medium text-primary underline underline-offset-2 hover:text-primary/80 transition-colors">{label}</a>
    }
    return <span key={i}>{part}</span>
  })
}

function renderMarkdown(text: string): ReactNode {
  if (!text) return null

  // Split into blocks by double newlines
  const rawBlocks = text.split(/\n{2,}/)
  const nodes: ReactNode[] = []

  for (let bi = 0; bi < rawBlocks.length; bi++) {
    const block = rawBlocks[bi].trim()
    if (!block) continue

    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean)

    // Image: standalone ![alt](url)
    if (lines.length === 1 && /^!\[.*?\]\(.*?\)$/.test(lines[0])) {
      const match = lines[0].match(/^!\[(.*?)\]\((.*?)\)$/)
      if (match) {
        nodes.push(
          <div key={bi} className="my-3">
            <img
              src={match[2]}
              alt={match[1]}
              className="h-24 w-24 rounded-xl object-cover shadow-md ring-1 ring-border"
            />
          </div>,
        )
        continue
      }
    }

    // Numbered list: every line starts with N.
    if (lines.every((l) => /^\d+\.\s/.test(l))) {
      nodes.push(
        <ol key={bi} className="my-2 space-y-1 pl-5 [list-style:decimal]">
          {lines.map((l, i) => (
            <li key={i} className="pl-1">
              {renderInline(l.replace(/^\d+\.\s/, ""))}
            </li>
          ))}
        </ol>,
      )
      continue
    }

    // Bullet list: every line starts with - or *
    if (lines.every((l) => /^[-*]\s/.test(l))) {
      // Check if any bullet contains an image
      nodes.push(
        <ul key={bi} className="my-2 space-y-1.5 pl-1">
          {lines.map((l, i) => {
            const content = l.replace(/^[-*]\s/, "")
            // Image inside bullet
            const imgMatch = content.match(/^!\[(.*?)\]\((.*?)\)$/)
            if (imgMatch) {
              return (
                <li key={i} className="flex items-start gap-2">
                  <img
                    src={imgMatch[2]}
                    alt={imgMatch[1]}
                    className="mt-0.5 h-20 w-20 rounded-lg object-cover shadow ring-1 ring-border"
                  />
                </li>
              )
            }
            return (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                <span>{renderInline(content)}</span>
              </li>
            )
          })}
        </ul>,
      )
      continue
    }

    // Mixed block: may have text + images inline on same line
    const mixedNodes: ReactNode[] = []
    for (let li = 0; li < lines.length; li++) {
      const line = lines[li]
      // Inline image: text ![alt](url) text
      if (/!\[.*?\]\(.*?\)/.test(line)) {
        const segments = line.split(/(!\[.*?\]\(.*?\))/g)
        segments.forEach((seg, si) => {
          const imgM = seg.match(/^!\[(.*?)\]\((.*?)\)$/)
          if (imgM) {
            mixedNodes.push(
              <img
                key={`${li}-${si}`}
                src={imgM[2]}
                alt={imgM[1]}
                className="my-2 h-20 w-20 rounded-lg object-cover shadow ring-1 ring-border"
              />,
            )
          } else if (seg) {
            mixedNodes.push(<span key={`${li}-${si}`}>{renderInline(seg)}</span>)
          }
        })
      } else {
        mixedNodes.push(<span key={li}>{renderInline(line)}</span>)
      }
      if (li < lines.length - 1) mixedNodes.push(<br key={`br-${li}`} />)
    }
    nodes.push(
      <p key={bi} className="my-1 leading-relaxed">
        {mixedNodes}
      </p>,
    )
  }

  return <>{nodes}</>
}

/* ─────────────── Copy button ─────────────── */

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false)
  return (
    <button
      type="button"
      onClick={() => { navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 2000) }}
      className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-muted hover:text-foreground"
    >
      {ok ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

/* ─────────────── Message bubble ─────────────── */

function Bubble({
  msg,
  isLast,
  onSuggest,
}: {
  msg: AiMessage
  isLast: boolean
  onSuggest: (t: string) => void
}) {
  const isUser = msg.role === "user"
  const isEmpty = !msg.content && msg.streaming
  const suggestions = isLast && !isUser && !msg.streaming && msg.content
    ? getSuggestionsForMessage(msg.content)
    : []

  return (
    <div className={cn("group flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      {/* INTI avatar */}
      {!isUser && (
        <div className="relative mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center">
          <div className="absolute inset-0 rounded-xl bg-primary/25 blur-sm" />
          <div className="relative flex h-8 w-8 items-center justify-center rounded-xl border border-primary/30 bg-card shadow-sm">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
        </div>
      )}

      <div className={cn("flex max-w-[82%] flex-col gap-2", isUser && "items-end")}>
        {/* Bubble body */}
        <div
          className={cn(
            "relative rounded-2xl px-4 py-3 text-sm",
            isUser
              ? "rounded-tr-md bg-primary text-primary-foreground shadow-md shadow-primary/20"
              : "rounded-tl-md border border-border/60 bg-card/80 backdrop-blur-sm shadow-sm",
          )}
        >
          {isEmpty ? (
            <span className="flex items-center gap-1.5 py-0.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce"
                  style={{ animationDelay: `${i * 180}ms` }}
                />
              ))}
            </span>
          ) : isUser ? (
            <span className="leading-relaxed">{msg.content}</span>
          ) : (
            <>
              {renderMarkdown(msg.content)}
              {msg.streaming && (
                <span className="ml-0.5 inline-block h-[1em] w-0.5 translate-y-0.5 animate-[pulse_0.8s_ease-in-out_infinite] bg-current opacity-60" />
              )}
            </>
          )}
        </div>

        {/* Copy (AI only) */}
        {!isUser && !msg.streaming && msg.content && (
          <div className="flex px-1">
            <CopyBtn text={msg.content} />
          </div>
        )}

        {/* Follow-up suggestions */}
        {suggestions.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-2 px-1">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSuggest(s)}
                className="flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition-all hover:bg-primary/10 hover:border-primary/40 hover:shadow-sm"
              >
                <ChevronRight className="h-3 w-3 opacity-60" />
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─────────────── Welcome screen ─────────────── */

function Welcome({ onSuggest }: { onSuggest: (t: string) => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-10 px-4 py-10">
      {/* Hero icon */}
      <div className="relative flex items-center justify-center">
        <div className="absolute h-32 w-32 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute h-20 w-20 rounded-full bg-primary/30 blur-xl" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/20 to-primary/5 shadow-xl shadow-primary/10 backdrop-blur-sm">
          <Sparkles className="h-11 w-11 text-primary" />
        </div>
      </div>

      <div className="space-y-2 text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          Hola, soy{" "}
          <span className="bg-gradient-to-r from-primary via-primary to-primary/60 bg-clip-text text-transparent">
            INTI
          </span>
        </h1>
        <p className="mx-auto max-w-md text-muted-foreground">
          Tu asistente de IntiFix. Cuéntame tu problema técnico y encontraré los mejores especialistas disponibles.
        </p>
      </div>

      {/* Suggested prompts grid */}
      <div className="grid w-full max-w-xl gap-3 sm:grid-cols-2">
        {SUGERENCIAS_WELCOME.map(({ icon: Icon, text, color }) => (
          <button
            key={text}
            type="button"
            onClick={() => onSuggest(text)}
            className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-4 text-left backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-card hover:shadow-md hover:shadow-primary/5"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="relative flex items-start gap-3">
              <span className={cn("mt-0.5 shrink-0", color)}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-sm leading-snug text-muted-foreground group-hover:text-foreground">
                {text}
              </span>
            </div>
          </button>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground/50">
        Presiona{" "}
        <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">↵ Enter</kbd>{" "}
        para enviar · <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">Shift+↵</kbd>{" "}
        nueva línea
      </p>
    </div>
  )
}

/* ─────────────── Main page ─────────────── */

export function AsistentePage() {
  const user = useAuthStore((s) => s.user)
  const userId = user?.idUsuario

  const [convId, setConvId] = useState(() =>
    userId ? getOrCreateConvId(userId) : crypto.randomUUID(),
  )
  const [messages, setMessages] = useState<AiMessage[]>([])
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const growTextarea = (el: HTMLTextAreaElement) => {
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isStreaming) return

      setInput("")
      setError(null)
      if (inputRef.current) inputRef.current.style.height = "auto"

      const userMsgId = crypto.randomUUID()
      const assistId = crypto.randomUUID()

      setMessages((p) => [
        ...p,
        { id: userMsgId, role: "user", content: trimmed },
        { id: assistId, role: "assistant", content: "", streaming: true },
      ])
      setIsStreaming(true)

      try {
        for await (const token of streamAiChat({ conversationId: convId, userId, message: trimmed })) {
          setMessages((p) =>
            p.map((m) => (m.id === assistId ? { ...m, content: m.content + token } : m)),
          )
        }
      } catch {
        setError("No pude conectarme con INTI. Inténtalo de nuevo.")
        setMessages((p) => p.filter((m) => m.id !== assistId))
      } finally {
        setIsStreaming(false)
        setMessages((p) => p.map((m) => (m.id === assistId ? { ...m, streaming: false } : m)))
      }
    },
    [convId, userId, isStreaming],
  )

  const handleReset = () => {
    if (!userId) return
    setConvId(resetConvId(userId))
    setMessages([])
    setError(null)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const hasMessages = messages.length > 0

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden">

      {/* ── Header ── */}
      <div className="relative shrink-0 border-b border-border/60 bg-card/80 backdrop-blur-md">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

        <div className="flex items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 shadow-sm shadow-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
              {isStreaming && (
                <span className="absolute -right-1 -top-1 flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold leading-none">INTI</p>
                <span className="hidden rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary sm:inline">
                  Asistente
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {isStreaming ? (
                  <span className="flex items-center gap-1.5 text-primary">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                    Escribiendo…
                  </span>
                ) : (
                  "IntiFix IA · en línea"
                )}
              </p>
            </div>
          </div>

          {hasMessages && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Nueva conversación
            </Button>
          )}
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="relative flex flex-1 flex-col overflow-y-auto">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,oklch(0.38_0.13_16/0.05),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,oklch(0.07_0.018_18/0.7),transparent)]" />

        {!hasMessages ? (
          <Welcome onSuggest={(t) => send(t)} />
        ) : (
          <div className="relative mx-auto w-full max-w-2xl space-y-6 px-4 py-6">
            {messages.map((msg, idx) => (
              <Bubble
                key={msg.id}
                msg={msg}
                isLast={idx === messages.length - 1}
                onSuggest={(t) => send(t)}
              />
            ))}

            {error && (
              <div className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span className="flex-1">{error}</span>
                <button type="button" onClick={() => setError(null)} className="text-xs underline opacity-70 hover:opacity-100">
                  Cerrar
                </button>
              </div>
            )}

            <div ref={bottomRef} className="h-2" />
          </div>
        )}
      </div>

      {/* ── Input bar ── */}
      <div className="relative shrink-0 border-t border-border/60 bg-card/80 px-4 py-4 backdrop-blur-md">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

        <div className="mx-auto flex max-w-2xl items-end gap-3">
          <div className="relative flex-1 overflow-hidden rounded-2xl border border-border/60 bg-background shadow-sm transition-all focus-within:border-primary/50 focus-within:shadow-md focus-within:shadow-primary/10">
            <textarea
              ref={inputRef}
              value={input}
              rows={1}
              disabled={isStreaming}
              onChange={(e) => { setInput(e.target.value); growTextarea(e.target) }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  send(input)
                }
              }}
              placeholder="Describe tu problema técnico…"
              className={cn(
                "w-full resize-none bg-transparent px-4 py-3.5 text-sm leading-relaxed outline-none",
                "placeholder:text-muted-foreground/50 disabled:opacity-50 max-h-40 min-h-[50px]",
              )}
              style={{ height: "50px" }}
            />
          </div>

          <button
            type="button"
            disabled={!input.trim() || isStreaming}
            onClick={() => send(input)}
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm transition-all",
              input.trim() && !isStreaming
                ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md hover:shadow-primary/25 active:scale-95"
                : "bg-muted text-muted-foreground cursor-not-allowed",
            )}
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-2.5 text-center text-[11px] text-muted-foreground/40">
          INTI puede cometer errores. Verifica la información antes de contratar un técnico.
        </p>
      </div>
    </div>
  )
}
