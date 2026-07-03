import { useAuthStore } from "@/stores/auth-store"

const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080"

export interface AiChatRequest {
  conversationId: string
  userId?: string
  message: string
}

/**
 * Streams AI response tokens via SSE (POST + ReadableStream).
 * Spring returns `text/event-stream` with `data: <token>\n\n` format.
 */
export async function* streamAiChat(req: AiChatRequest): AsyncGenerator<string> {
  const token = useAuthStore.getState().accessToken

  const res = await fetch(`${BASE}/api/v1/ai/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(req),
  })

  if (!res.ok || !res.body) {
    throw new Error(`AI stream error: ${res.status}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buf = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buf += decoder.decode(value, { stream: true })
    const lines = buf.split("\n")
    buf = lines.pop() ?? ""

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      if (trimmed.startsWith("data:")) {
        const data = trimmed.slice(5)
        if (data && data !== "[DONE]") yield data
      } else {
        yield trimmed
      }
    }
  }

  if (buf.trim() && !buf.trim().startsWith("data:")) yield buf.trim()
}
