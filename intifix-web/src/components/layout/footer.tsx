import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface FooterProps {
  children: ReactNode
  className?: string
}

export function Footer({ children, className }: FooterProps) {
  return (
    <footer className={cn("w-full bg-muted/50 border-t mt-auto", className)}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </footer>
  )
}
