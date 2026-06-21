import type { Role } from "@/types/auth"

export const paths = {
  landing: "/",
  login: "/login",
  register: "/register",

  cliente: {
    dashboard: "/cliente",
    perfil: "/cliente/perfil",
    pedir: "/cliente/pedir-servicio",
    servicios: "/cliente/servicios",
    servicioDetalle: (id = ":idServicio") => `/cliente/servicios/${id}`,
    buscarTecnicos: "/cliente/buscar-tecnicos",
    pagos: "/cliente/pagos",
    pago: (id = ":idServicio") => `/cliente/pago/${id}`,
  },

  tecnico: {
    dashboard: "/tecnico",
    perfil: "/tecnico/perfil",
    especialidades: "/tecnico/especialidades",
    agenda: "/tecnico/agenda",
    disponibles: "/tecnico/servicios-disponibles",
    cotizaciones: "/tecnico/cotizaciones",
    asignaciones: "/tecnico/asignaciones",
    reputacion: "/tecnico/reputacion",
    ubicacion: "/tecnico/ubicacion",
  },

  shared: {
    chat: "/chat",
    notificaciones: "/notificaciones",
  },
} as const

/** Where to send a user right after authenticating, based on their roles. */
export function dashboardPathForRoles(roles: Role[]): string {
  if (roles.includes("TECNICO")) return paths.tecnico.dashboard
  if (roles.includes("CLIENTE")) return paths.cliente.dashboard
  return paths.landing
}
