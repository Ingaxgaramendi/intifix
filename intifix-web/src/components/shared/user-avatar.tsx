import { cn } from "@/lib/utils"

/**
 * Avatar de usuario: muestra la foto de perfil si existe, o las iniciales del
 * nombre como fallback (estilo WhatsApp). `size` en px.
 */
export function UserAvatar({
  nombre,
  fotoUrl,
  size = 40,
  className,
}: {
  nombre?: string | null
  fotoUrl?: string | null
  size?: number
  className?: string
}) {
  const label = (nombre ?? "").trim()
  const initials = label ? label.slice(0, 2).toUpperCase() : "?"
  if (fotoUrl) {
    return (
      <img
        src={fotoUrl}
        alt={label || "Usuario"}
        style={{ width: size, height: size }}
        className={cn("shrink-0 rounded-full object-cover", className)}
      />
    )
  }
  return (
    <span
      style={{ width: size, height: size }}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary",
        className,
      )}
    >
      {initials}
    </span>
  )
}
