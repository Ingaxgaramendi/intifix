import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class names (shadcn/ui convention). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" });
}

export function formatMoney(value?: number | null, currency = "PEN"): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("es-PE", { style: "currency", currency }).format(value);
}

export function formatNumber(value?: number | null): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("es-PE").format(value);
}
