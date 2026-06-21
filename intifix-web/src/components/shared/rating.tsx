import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface RatingProps {
  value: number
  max?: number
  size?: "sm" | "md" | "lg"
  readonly?: boolean
  onChange?: (value: number) => void
  className?: string
}

export function Rating({ 
  value, 
  max = 5, 
  size = "md", 
  readonly = true,
  onChange,
  className 
}: RatingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6"
  }

  const handleClick = (rating: number) => {
    if (!readonly && onChange) {
      onChange(rating)
    }
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {Array.from({ length: max }).map((_, index) => {
        const starValue = index + 1
        const isFilled = starValue <= value
        const isHalf = !isFilled && starValue - 0.5 <= value

        return (
          <button
            key={index}
            type="button"
            disabled={readonly}
            onClick={() => handleClick(starValue)}
            className={cn(
              "transition-colors",
              readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
            )}
          >
            <Star
              className={cn(
                sizeClasses[size],
                isFilled
                  ? "fill-yellow-400 text-yellow-400"
                  : isHalf
                  ? "fill-yellow-400/50 text-yellow-400"
                  : "fill-muted text-muted-foreground"
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
