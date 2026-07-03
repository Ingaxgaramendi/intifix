import type { Role } from "@/types/auth"

export const paths = {
  landing: "/",
  login: "/login",
  register: "/register",
  resetPassword: "/reset-password",
  about: "/nosotros",
  pricing: "/precios",

  cliente: {
    dashboard: "/cliente",
    perfil: "/cliente/perfil",
    pedir: "/cliente/pedir-servicio",
    servicios: "/cliente/servicios",
    servicioDetalle: (id = ":idServicio") => `/cliente/servicios/${id}`,
    buscarTecnicos: "/cliente/buscar-tecnicos",
    tecnicoPerfil: (id = ":idTecnico") => `/cliente/tecnicos/${id}`,
    miPerfilPublico: "/cliente/perfil-publico",
    pagos: "/cliente/pagos",
    pago: (id = ":idServicio") => `/cliente/pago/${id}`,
  },

  tecnico: {
    dashboard: "/tecnico",
    perfil: "/tecnico/perfil",
    especialidades: "/tecnico/especialidades",
    agenda: "/tecnico/agenda",
    disponibles: "/tecnico/servicios-disponibles",
    directas: "/tecnico/solicitudes-directas",
    clientePerfil: (id = ":idCliente") => `/tecnico/clientes/${id}`,
    miPerfilPublico: "/tecnico/perfil-publico",
    cotizaciones: "/tecnico/cotizaciones",
    cotizacionDetalle: (idServicio = ":idServicio", idCotizacion = ":idCotizacion") =>
      `/tecnico/cotizaciones/${idServicio}/${idCotizacion}`,
    asignaciones: "/tecnico/asignaciones",
    asignacionDetalle: (id = ":idAsignacion") => `/tecnico/asignaciones/${id}`,
    ingresos: "/tecnico/ingresos",
    reputacion: "/tecnico/reputacion",
  },

  shared: {
    chat: "/chat",
    chatConversacion: (id = ":idConversacion") => `/chat/${id}`,
    notificaciones: "/notificaciones",
    asistente: "/asistente",
  },
} as const

/** Where to send a user right after authenticating, based on their roles. */
export function dashboardPathForRoles(roles: Role[]): string {
  if (roles.includes("TECNICO")) return paths.tecnico.dashboard
  if (roles.includes("CLIENTE")) return paths.cliente.dashboard
  return paths.landing
}
