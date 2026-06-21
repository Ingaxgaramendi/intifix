import { useState } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Star rating. Interactive when onChange is provided (click/hover to set),
 * read-only otherwise (renders the given value, supports halves visually).
 */
export function StarRating({
  value = 0,
  onChange,
  size = 20,
  className,
}: {
  value?: number
  onChange?: (v: number) => void
  size?: number
  className?: string
}) {
  const [hover, setHover] = useState<number | null>(null)
  const readOnly = !onChange
  const shown = hover ?? value

  return (
    <div className={cn("inline-flex items-center gap-0.5", className)} role={readOnly ? "img" : "radiogroup"}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = shown >= star
        return (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            aria-label={`${star} estrella${star > 1 ? "s" : ""}`}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => !readOnly && setHover(star)}
            onMouseLeave={() => !readOnly && setHover(null)}
            className={cn(!readOnly && "cursor-pointer transition-transform hover:scale-110", readOnly && "cursor-default")}
          >
            <Star
              style={{ width: size, height: size }}
              className={cn(filled ? "fill-warning text-warning" : "fill-transparent text-muted-foreground/40")}
            />
          </button>
        )
      })}
    </div>
  )
}
