import { Input as ShadcnInput } from "@/components/ui/input"
import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"

interface InputProps extends ComponentProps<typeof ShadcnInput> {
  error?: string
}

export function Input({ error, className, ...props }: InputProps) {
  return (
    <div className="w-full">
      <ShadcnInput
        className={cn(
          error && "border-destructive focus-visible:ring-destructive",
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
