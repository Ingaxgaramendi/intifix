import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Para PDFs en Cloudinary (/image/upload/*.pdf), agrega fl_attachment.
 * Uso: botón de descarga (<a download>). fl_attachment entrega el PDF
 * original con Content-Disposition: attachment.
 */
export function toViewableUrl(url: string): string {
  if (
    url &&
    url.includes("res.cloudinary.com") &&
    url.includes("/image/upload/") &&
    !/fl_(attachment|inline)/.test(url) &&
    /\.pdf$/i.test(url)
  ) {
    return url.replace("/image/upload/", "/image/upload/fl_attachment/")
  }
  return url
}

