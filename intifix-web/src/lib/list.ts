import type { Page } from "@/types/api"

/**
 * Normalizes a list response to a plain array, tolerating endpoints that return
 * either a Spring `Page<T>` or a bare `T[]` (the brief is inconsistent on this).
 */
export function toItems<T>(data: Page<T> | T[] | undefined | null): T[] {
  if (!data) return []
  if (Array.isArray(data)) return data
  return data.content ?? []
}
