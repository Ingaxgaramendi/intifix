import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface HeaderProps {
  children: ReactNode
  className?: string
  variant?: "default" | "transparent" | "sticky"
}

export function Header({ children, className, variant = "default" }: HeaderProps) {
  const variantClasses = {
    default: "bg-background border-b",
    transparent: "bg-transparent",
    sticky: "sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b"
  }

  return (
    <header className={cn("w-full", variantClasses[variant], className)}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </header>
  )
}
