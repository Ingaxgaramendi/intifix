import { Input } from "@/components/ui/input"
import { Button } from "@/components/shared/button"
import { Search, MapPin, Filter } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchBarProps {
  className?: string
  onSearch?: (query: string) => void
  onFilterClick?: () => void
  showLocation?: boolean
  placeholder?: string
}

export function SearchBar({ 
  className, 
  onSearch, 
  onFilterClick,
  showLocation = true,
  placeholder = "¿Qué necesitas reparar?"
}: SearchBarProps) {
  return (
    <div className={cn("w-full max-w-3xl mx-auto", className)}>
      <div className="flex items-center gap-2 bg-background border border-input rounded-xl shadow-sm p-2">
        <div className="flex-1 flex items-center gap-2">
          <Search className="h-5 w-5 text-muted-foreground ml-2" />
          <Input
            placeholder={placeholder}
            className="border-0 focus-visible:ring-0 shadow-none text-base"
            onChange={(e) => onSearch?.(e.target.value)}
          />
        </div>
        
        {showLocation && (
          <div className="hidden md:flex items-center gap-2 border-l pl-2">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Ubicación"
              className="border-0 focus-visible:ring-0 shadow-none w-40"
            />
          </div>
        )}
        
        <Button size="lg" className="rounded-lg">
          <Search className="h-5 w-5" />
        </Button>
        
        {onFilterClick && (
          <Button size="lg" variant="outline" className="rounded-lg" onClick={onFilterClick}>
            <Filter className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  )
}
