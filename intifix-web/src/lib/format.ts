/** Format a number as Peruvian Soles (siempre con 2 decimales). "—" si es nulo. */
export function formatCurrency(value?: number | null): string {
  if (value == null || Number.isNaN(value)) return "—"
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/** Format a price range, collapsing to a single value when min === max. */
export function formatRange(min?: number | null, max?: number | null): string {
  if (min != null && max != null && min !== max) {
    return `${formatCurrency(min)} – ${formatCurrency(max)}`
  }
  return formatCurrency(min ?? max)
}

/** Human date like "16 jun 2026". Returns "—" for invalid input. */
export function formatDate(value?: string | null): string {
  if (!value) return "—"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" })
}

/** Relative time like "ahora", "hace 5 min", "hace 2 h", "ayer". Falls back to date. */
export function formatRelative(value?: string | null): string {
  if (!value) return "—"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "—"
  const min = Math.floor((Date.now() - d.getTime()) / 60000)
  if (min < 1) return "ahora"
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  const days = Math.floor(h / 24)
  if (days === 1) return "ayer"
  if (days < 7) return `hace ${days} d`
  return formatDate(value)
}

/** Date + time like "16 jun, 14:30". */
export function formatDateTime(value?: string | null): string {
  if (!value) return "—"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleString("es-PE", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}
