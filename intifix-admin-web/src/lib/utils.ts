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

/**
 * Para PDFs en Cloudinary (/image/upload/*.pdf), agrega fl_attachment.
 * Uso: botón de descarga (<a download>).
 */
export function toViewableUrl(url: string): string {
  if (
    url &&
    url.includes("res.cloudinary.com") &&
    url.includes("/image/upload/") &&
    !/fl_(attachment|inline)/.test(url) &&
    /\.pdf$/i.test(url)
  ) {
    return url.replace("/image/upload/", "/image/upload/fl_attachment/");
  }
  return url;
}

/**
 * Para PDFs en Cloudinary (/image/upload/*.pdf), agrega fl_inline.
 * Uso: <iframe> de visualización. fl_inline entrega el PDF original con
 * Content-Disposition: inline — sin fetch() desde JS, sin CORS.
 */
export function toPdfInlineUrl(url: string): string {
  if (
    url &&
    url.includes("res.cloudinary.com") &&
    url.includes("/image/upload/") &&
    !/fl_(attachment|inline)/.test(url) &&
    /\.pdf$/i.test(url)
  ) {
    return url.replace("/image/upload/", "/image/upload/fl_inline/");
  }
  return url;
}
