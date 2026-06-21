/** Format a number as Peruvian Soles. Returns "—" for nullish values. */
export function formatCurrency(value?: number | null): string {
  if (value == null || Number.isNaN(value)) return "—"
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    maximumFractionDigits: 0,
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
