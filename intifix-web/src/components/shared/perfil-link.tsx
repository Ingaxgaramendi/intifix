import { type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"

/**
 * Nombre de usuario clickeable que lleva a su perfil (estilo red social).
 * Si no hay destino (`to` vacío), cae a texto plano sin enlace.
 * Detiene la propagación para poder usarse dentro de tarjetas/botones.
 */
export function PerfilLink({
  to,
  state,
  children,
  className,
}: {
  to?: string
  state?: unknown
  children: ReactNode
  className?: string
}) {
  const navigate = useNavigate()
  if (!to) return <span className={className}>{children}</span>
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        navigate(to, state ? { state } : undefined)
      }}
      className={cn(
        "rounded text-left font-medium text-primary transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {children}
    </button>
  )
}
