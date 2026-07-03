import { useCallback, useEffect, useState } from "react"
import type { MetodoPago } from "@/types/payment"

/** Tipos de método que ofrece la pasarela (UI), independientes del catálogo. */
export type MetodoTipo = "TARJETA" | "YAPE" | "PLIN"

export type CardBrand = "visa" | "mastercard" | "amex" | "diners" | "card"

export interface SavedCard {
  id: string
  brand: CardBrand
  last4: string
  /** MM/YY */
  exp: string
  holder: string
}

/* ----------------------------- Card helpers ----------------------------- */

export const onlyDigits = (s: string) => s.replace(/\D+/g, "")

/** Detecta la marca por los primeros dígitos (IIN ranges). */
export function detectBrand(num: string): CardBrand {
  const n = onlyDigits(num)
  if (/^4/.test(n)) return "visa"
  if (/^(5[1-5]|2[2-7])/.test(n)) return "mastercard"
  if (/^3[47]/.test(n)) return "amex"
  if (/^3(0[0-5]|[68])/.test(n)) return "diners"
  return "card"
}

export const BRAND_LABEL: Record<CardBrand, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "American Express",
  diners: "Diners Club",
  card: "Tarjeta",
}

/** Algoritmo de Luhn para validar el número de tarjeta. */
export function luhnValid(num: string): boolean {
  const n = onlyDigits(num)
  if (n.length < 13) return false
  let sum = 0
  let alt = false
  for (let i = n.length - 1; i >= 0; i--) {
    let d = Number(n[i])
    if (alt) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
    alt = !alt
  }
  return sum % 10 === 0
}

/** Formatea el número en grupos (4-4-4-4, o 4-6-5 para Amex). */
export function formatCardNumber(raw: string): string {
  const n = onlyDigits(raw).slice(0, 19)
  const isAmex = /^3[47]/.test(n)
  if (isAmex) {
    return [n.slice(0, 4), n.slice(4, 10), n.slice(10, 15)].filter(Boolean).join(" ")
  }
  return (n.match(/.{1,4}/g) ?? []).join(" ")
}

/** Formatea la fecha de expiración como MM/YY mientras se escribe. */
export function formatExpiry(raw: string): string {
  const n = onlyDigits(raw).slice(0, 4)
  if (n.length <= 2) return n
  return `${n.slice(0, 2)}/${n.slice(2)}`
}

/** Valida MM/YY y que no esté vencida. */
export function expiryValid(exp: string): boolean {
  const m = /^(\d{2})\/(\d{2})$/.exec(exp.trim())
  if (!m) return false
  const mes = Number(m[1])
  const anio = 2000 + Number(m[2])
  if (mes < 1 || mes > 12) return false
  const fin = new Date(anio, mes, 0, 23, 59, 59) // último día del mes
  return fin.getTime() >= Date.now()
}

export const cvcLen = (brand: CardBrand) => (brand === "amex" ? 4 : 3)

/* --------------------------- Catálogo (backend) -------------------------- */

const KEYWORDS: Record<MetodoTipo, RegExp> = {
  TARJETA: /tarjeta|card|visa|master|crédito|credito|débito|debito/i,
  YAPE: /yape/i,
  PLIN: /plin/i,
}

/**
 * Resuelve el idMetodoPago del catálogo para un tipo. Si el catálogo no tiene un
 * método con ese nombre, cae al primero disponible (el detalle real del método
 * elegido viaja igual en la metadata del pago).
 */
export function resolveMetodoId(tipo: MetodoTipo, methods?: MetodoPago[]): string | undefined {
  if (!methods?.length) return undefined
  const match = methods.find((m) => KEYWORDS[tipo].test(m.nombre))
  return (match ?? methods[0]).idMetodoPago
}

/* --------------------- Tarjetas guardadas (localStorage) ----------------- */

const cardsKey = (uid: string) => `intifix.cards.${uid}`

function readCards(uid: string): SavedCard[] {
  try {
    const raw = localStorage.getItem(cardsKey(uid))
    return raw ? (JSON.parse(raw) as SavedCard[]) : []
  } catch {
    return []
  }
}

/**
 * Tarjetas guardadas del cliente. El backend no almacena tarjetas, así que las
 * persistimos localmente y de forma segura: SOLO marca, últimos 4 y vencimiento
 * (nunca el número completo ni el CVC). Es lo mismo que muestra cualquier wallet.
 */
export function useSavedCards(uid: string | undefined) {
  const [cards, setCards] = useState<SavedCard[]>(() => (uid ? readCards(uid) : []))

  useEffect(() => {
    setCards(uid ? readCards(uid) : [])
  }, [uid])

  const persist = useCallback(
    (next: SavedCard[]) => {
      setCards(next)
      if (uid) localStorage.setItem(cardsKey(uid), JSON.stringify(next))
    },
    [uid],
  )

  const addCard = useCallback(
    (card: Omit<SavedCard, "id">) => {
      const nueva: SavedCard = { ...card, id: crypto.randomUUID() }
      // Evita duplicados exactos (misma marca + últimos 4 + exp).
      const sinDup = cards.filter(
        (c) => !(c.brand === nueva.brand && c.last4 === nueva.last4 && c.exp === nueva.exp),
      )
      persist([nueva, ...sinDup])
      return nueva
    },
    [cards, persist],
  )

  const removeCard = useCallback(
    (id: string) => persist(cards.filter((c) => c.id !== id)),
    [cards, persist],
  )

  return { cards, addCard, removeCard }
}
