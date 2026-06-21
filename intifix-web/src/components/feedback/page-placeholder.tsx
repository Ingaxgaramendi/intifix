import type { LucideIcon } from "lucide-react"
import { Hammer } from "lucide-react"

/**
 * Friendly stand-in for screens that are routed but not yet implemented.
 * Keeps the whole app navigable while features are built incrementally.
 */
export function PagePlaceholder({
  title,
  description,
  icon: Icon = Hammer,
}: {
  title: string
  description?: string
  icon?: LucideIcon
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-8 w-8" />
      </span>
      <h1 className="mt-6 text-2xl font-bold tracking-tight">{title}</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        {description ?? "Esta pantalla está en construcción y se conectará a su endpoint real próximamente."}
      </p>
    </div>
  )
}
