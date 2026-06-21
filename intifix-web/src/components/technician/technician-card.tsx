import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/shared/card"
import { Badge } from "@/components/shared/badge"
import { Rating } from "@/components/shared/rating"
import { MapPin, Clock, DollarSign } from "lucide-react"
import { cn } from "@/lib/utils"

interface TechnicianCardProps {
  id: string
  name: string
  avatar?: string
  rating: number
  reviewCount: number
  specialties: string[]
  location: string
  responseTime: string
  priceRange: string
  available: boolean
  className?: string
  onClick?: () => void
}

export function TechnicianCard({
  name,
  avatar,
  rating,
  reviewCount,
  specialties,
  location,
  responseTime,
  priceRange,
  available,
  className,
  onClick
}: TechnicianCardProps) {
  const initials = name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <Card
      variant="interactive"
      className={cn("p-6", className)}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={avatar} alt={name} />
          <AvatarFallback className="bg-primary text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-lg truncate">{name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Rating value={rating} size="sm" readonly />
                <span className="text-sm text-muted-foreground">
                  ({reviewCount})
                </span>
              </div>
            </div>
            {available && (
              <Badge colorVariant="success" className="shrink-0">
                Disponible
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {specialties.slice(0, 3).map((specialty) => (
              <Badge key={specialty} variant="outline" className="text-xs">
                {specialty}
              </Badge>
            ))}
            {specialties.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{specialties.length - 3}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span className="truncate">{location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{responseTime}</span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              <span>{priceRange}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
