import { cn } from "@/lib/utils"
import { Badge as ShadcnBadge } from "@/components/ui/badge"
import type { ComponentProps } from "react"
import { cva, type VariantProps } from "class-variance-authority"

const badgeVariants = cva("", {
  variants: {
    colorVariant: {
      default: "",
      primary: "bg-primary text-primary-foreground hover:bg-primary/90",
      success: "bg-success text-white hover:bg-success/90",
      warning: "bg-warning text-white hover:bg-warning/90",
      error: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      outline: "text-foreground border border-input bg-background hover:bg-accent hover:text-accent-foreground"
    }
  },
  defaultVariants: {
    colorVariant: "default"
  }
})

interface BadgeProps extends ComponentProps<typeof ShadcnBadge>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, colorVariant, ...props }: BadgeProps) {
  return (
    <ShadcnBadge
      className={cn(badgeVariants({ colorVariant }), className)}
      {...props}
    />
  )
}
