import { cn } from "@/lib/utils"
import { Card as ShadcnCard } from "@/components/ui/card"
import type { ComponentProps } from "react"

interface CardProps extends ComponentProps<typeof ShadcnCard> {
  variant?: "default" | "elevated" | "flat" | "interactive"
}

export function Card({ className, variant = "default", ...props }: CardProps) {
  const variantClasses = {
    default: "shadow-sm",
    elevated: "shadow-lg",
    flat: "border",
    interactive: "shadow-sm hover:shadow-md transition-shadow cursor-pointer"
  }

  return (
    <ShadcnCard
      className={cn(variantClasses[variant], className)}
      {...props}
    />
  )
}
