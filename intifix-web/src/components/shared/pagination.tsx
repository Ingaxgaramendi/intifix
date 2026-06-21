import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

/** Prev/next pager for Spring `Page<T>` results. Renders nothing for single pages. */
export function Pagination({
  page,
  totalPages,
  first,
  last,
  onPageChange,
}: {
  page: number
  totalPages: number
  first: boolean
  last: boolean
  onPageChange: (page: number) => void
}) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-4 pt-2">
      <Button
        variant="outline"
        size="icon"
        disabled={first}
        onClick={() => onPageChange(Math.max(0, page - 1))}
        aria-label="Anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm text-muted-foreground">
        Página {page + 1} de {totalPages}
      </span>
      <Button
        variant="outline"
        size="icon"
        disabled={last}
        onClick={() => onPageChange(page + 1)}
        aria-label="Siguiente"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
