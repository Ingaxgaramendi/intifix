import { cn } from "@/lib/utils"
import { Button as ShadcnButton } from "@/components/ui/button"
import type { ComponentProps } from "react"
import { Loader2 } from "lucide-react"

interface ButtonProps extends ComponentProps<typeof ShadcnButton> {
  loading?: boolean
}

export function Button({ children, loading, disabled, className, asChild, ...props }: ButtonProps) {
  // Con asChild, Radix Slot exige UN solo hijo: no podemos inyectar el spinner
  // como hermano. Pasamos el hijo tal cual.
  if (asChild) {
    return (
      <ShadcnButton asChild disabled={disabled || loading} className={cn(className)} {...props}>
        {children}
      </ShadcnButton>
    )
  }

  return (
    <ShadcnButton disabled={disabled || loading} className={cn(className)} {...props}>
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </ShadcnButton>
  )
}
