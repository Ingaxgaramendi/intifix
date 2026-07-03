import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  type WheelEvent,
} from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import { X, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

const MIN_SCALE = 1
const MAX_SCALE = 5
const STEP = 0.5

/**
 * Visor de imagen a pantalla completa con zoom (rueda del mouse o botones) y
 * arrastre para desplazar cuando hay zoom. Soporta varias fotos con flechas /
 * teclado. Se monta sobre un portal y queda por encima de cualquier Modal.
 */
export function ImageLightbox({
  fotos,
  index,
  alt,
  onClose,
  onIndexChange,
}: {
  fotos: string[]
  index: number
  alt?: string
  onClose: () => void
  onIndexChange: (i: number) => void
}) {
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const drag = useRef<{ x: number; y: number } | null>(null)
  const [dragging, setDragging] = useState(false)

  const reset = useCallback(() => {
    setScale(1)
    setOffset({ x: 0, y: 0 })
  }, [])

  // Al cambiar de foto, volvemos al encuadre original.
  useEffect(() => {
    reset()
  }, [index, reset])

  const zoomBy = useCallback((delta: number) => {
    setScale((s) => {
      const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.round((s + delta) * 100) / 100))
      if (next === MIN_SCALE) setOffset({ x: 0, y: 0 })
      return next
    })
  }, [])

  const go = useCallback(
    (dir: number) => {
      if (fotos.length < 2) return
      onIndexChange((index + dir + fotos.length) % fotos.length)
    },
    [fotos.length, index, onIndexChange],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      else if (e.key === "ArrowRight") go(1)
      else if (e.key === "ArrowLeft") go(-1)
      else if (e.key === "+" || e.key === "=") zoomBy(STEP)
      else if (e.key === "-" || e.key === "_") zoomBy(-STEP)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [go, onClose, zoomBy])

  const onWheel = (e: WheelEvent) => {
    e.preventDefault()
    zoomBy(e.deltaY < 0 ? STEP : -STEP)
  }

  const onPointerDown = (e: PointerEvent) => {
    if (scale <= 1) return
    e.preventDefault()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX - offset.x, y: e.clientY - offset.y }
    setDragging(true)
  }
  const onPointerMove = (e: PointerEvent) => {
    if (!drag.current) return
    setOffset({ x: e.clientX - drag.current.x, y: e.clientY - drag.current.y })
  }
  const endDrag = () => {
    drag.current = null
    setDragging(false)
  }

  const zoomed = scale > 1

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="lightbox"
        role="dialog"
        aria-modal="true"
        aria-label={alt ?? "Imagen"}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1200] flex items-center justify-center bg-foreground/90 backdrop-blur-sm"
        onClick={onClose}
      >
        {/* Controles */}
        <div className="absolute right-3 top-3 z-10 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <ControlBtn label="Alejar" onClick={() => zoomBy(-STEP)} disabled={scale <= MIN_SCALE}>
            <ZoomOut className="h-5 w-5" />
          </ControlBtn>
          <span className="min-w-12 text-center text-sm font-medium tabular-nums text-background">
            {Math.round(scale * 100)}%
          </span>
          <ControlBtn label="Acercar" onClick={() => zoomBy(STEP)} disabled={scale >= MAX_SCALE}>
            <ZoomIn className="h-5 w-5" />
          </ControlBtn>
          <ControlBtn label="Restablecer" onClick={reset} disabled={!zoomed}>
            <RotateCcw className="h-5 w-5" />
          </ControlBtn>
          <ControlBtn label="Cerrar" onClick={onClose}>
            <X className="h-5 w-5" />
          </ControlBtn>
        </div>

        {/* Navegación entre fotos */}
        {fotos.length > 1 && (
          <>
            <ControlBtn
              label="Anterior"
              onClick={(e) => {
                e.stopPropagation()
                go(-1)
              }}
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2"
            >
              <ChevronLeft className="h-6 w-6" />
            </ControlBtn>
            <ControlBtn
              label="Siguiente"
              onClick={(e) => {
                e.stopPropagation()
                go(1)
              }}
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2"
            >
              <ChevronRight className="h-6 w-6" />
            </ControlBtn>
            <div
              className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-foreground/60 px-3 py-1 text-xs font-medium text-background"
              onClick={(e) => e.stopPropagation()}
            >
              {index + 1} / {fotos.length}
            </div>
          </>
        )}

        {/* Imagen */}
        <img
          src={fotos[index]}
          alt={alt ?? ""}
          draggable={false}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => {
            e.stopPropagation()
            zoomed ? reset() : zoomBy(MAX_SCALE)
          }}
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className={cn(
            "max-h-[92vh] max-w-[94vw] touch-none select-none object-contain",
            !dragging && "transition-transform duration-150",
            zoomed ? (dragging ? "cursor-grabbing" : "cursor-grab") : "cursor-zoom-in",
          )}
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
        />
      </motion.div>
    </AnimatePresence>,
    document.body,
  )
}

function ControlBtn({
  children,
  label,
  onClick,
  disabled,
  className,
}: {
  children: ReactNode
  label: string
  onClick: (e: MouseEvent) => void
  disabled?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full bg-background/15 text-background backdrop-blur transition hover:bg-background/30 disabled:cursor-not-allowed disabled:opacity-40",
        className,
      )}
    >
      {children}
    </button>
  )
}
