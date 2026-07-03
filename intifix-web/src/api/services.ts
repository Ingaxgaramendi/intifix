import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/axios"
import type { Page, PageParams } from "@/types/api"
import type {
  Asignacion,
  Cotizacion,
  CreateCotizacionRequest,
  CreateEvidenciaRequest,
  CreateServiceRequest,
  EstadoServicio,
  Evidencia,
  Servicio,
} from "@/types/service"

export type { TipoFecha } from "@/types/service"

const pageParams = (p?: PageParams) => ({
  params: { page: p?.page ?? 0, size: p?.size ?? 12, ...(p?.sort ? { sort: p.sort } : {}) },
})

export const servicesApi = {
  /* ---- Service CRUD ---- */
  create: (body: CreateServiceRequest) => apiPost<Servicio>("/api/v1/services", body),

  byCliente: (idCliente: string, p?: PageParams) =>
    apiGet<Page<Servicio>>(`/api/v1/services/cliente/${idCliente}`, pageParams(p)),

  byEstado: (estado: EstadoServicio, p?: PageParams) =>
    apiGet<Page<Servicio>>(`/api/v1/services/estado/${estado}`, pageParams(p)),

  countByCliente: (idCliente: string) =>
    apiGet<number>(`/api/v1/services/cliente/${idCliente}/count`),

  detalle: (idServicio: string) => apiGet<Servicio>(`/api/v1/services/${idServicio}/detalle`),

  /** TECNICO: services open for quoting (paginated). */
  disponibles: (p?: PageParams) =>
    apiGet<Page<Servicio>>("/api/v1/services/disponibles", pageParams(p)),

  update: (idServicio: string, body: Partial<CreateServiceRequest>) =>
    apiPut<Servicio>(`/api/v1/services/${idServicio}`, body),

  changeEstado: (idServicio: string, estado: EstadoServicio, comentario?: string) =>
    apiPatch<Servicio>(`/api/v1/services/${idServicio}/estado`, {
      estado,
      ...(comentario ? { comentario } : {}),
    }),

  remove: (idServicio: string) => apiDelete<void>(`/api/v1/services/${idServicio}`),

  /* ---- Quotes (cotizaciones) ---- */
  crearCotizacion: (body: CreateCotizacionRequest) =>
    apiPost<Cotizacion>("/api/v1/services/cotizaciones", body),

  cotizacionesByTecnico: (idUsuarioTecnico: string, p?: PageParams) =>
    apiGet<Page<Cotizacion>>(
      `/api/v1/services/cotizaciones/tecnico/${idUsuarioTecnico}`,
      pageParams(p),
    ),

  cancelarCotizacion: (idCotizacion: string) =>
    apiDelete<void>(`/api/v1/services/cotizaciones/${idCotizacion}`),

  cotizacionesOrdenadas: (idServicio: string) =>
    apiGet<Cotizacion[]>(`/api/v1/services/cotizaciones/servicio/${idServicio}/ordenadas`),

  cotizacionesPendientes: (idServicio: string) =>
    apiGet<Cotizacion[]>(`/api/v1/services/cotizaciones/servicio/${idServicio}/pendientes`),

  responderCotizacion: (
    idCotizacion: string,
    estado: "ACEPTADA" | "RECHAZADA",
    motivo?: string,
  ) =>
    apiPatch<Cotizacion>(`/api/v1/services/cotizaciones/${idCotizacion}/responder`, {
      estado,
      ...(motivo ? { motivo } : {}),
    }),

  /* ---- Assignments (asignaciones) ---- */
  asignarTecnico: (idServicio: string, idUsuarioTecnico: string, idCotizacion: string) =>
    apiPost<Asignacion>(`/api/v1/services/asignaciones/${idServicio}/asignar`, {
      idUsuarioTecnico,
      idCotizacion,
    }),

  asignacionesByServicio: (idServicio: string) =>
    apiGet<Asignacion[]>(`/api/v1/services/asignaciones/servicio/${idServicio}`),

  cancelarAsignacion: (idAsignacion: string) =>
    apiDelete<void>(`/api/v1/services/asignaciones/${idAsignacion}`),

  /** TECNICO: my assignments (paginated). */
  asignacionesByTecnico: (idUsuarioTecnico: string, p?: PageParams) =>
    apiGet<Page<Asignacion>>(
      `/api/v1/services/asignaciones/tecnico/${idUsuarioTecnico}`,
      pageParams(p),
    ),

  countAsignacionesByTecnico: (idUsuarioTecnico: string) =>
    apiGet<number>(`/api/v1/services/asignaciones/tecnico/${idUsuarioTecnico}/count`),

  // No body — TECNICO actions.
  iniciarAsignacion: (idAsignacion: string) =>
    apiPatch<Asignacion>(`/api/v1/services/asignaciones/${idAsignacion}/iniciar`),

  finalizarAsignacion: (idAsignacion: string) =>
    apiPatch<Asignacion>(`/api/v1/services/asignaciones/${idAsignacion}/finalizar`),

  /* ---- Evidence ---- */
  crearEvidencia: (body: CreateEvidenciaRequest) =>
    apiPost<Evidencia>("/api/v1/services/evidencias", body),

  evidenciasByServicio: (idServicio: string) =>
    apiGet<Evidencia[]>(`/api/v1/services/evidencias/servicio/${idServicio}`),

  /* ---- Direct requests (TECNICO) ---- */
  solicitudesDirectas: (p?: PageParams) =>
    apiGet<Page<Servicio>>("/api/v1/services/directas", pageParams(p)),

  aceptarDirecta: (idServicio: string) =>
    apiPost<Servicio>(`/api/v1/services/directas/${idServicio}/aceptar`, {}),

  rechazarDirecta: (idServicio: string) =>
    apiPost<Servicio>(`/api/v1/services/directas/${idServicio}/rechazar`, {}),
}
