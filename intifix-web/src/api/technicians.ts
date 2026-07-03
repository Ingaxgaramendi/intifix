import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/axios"
import type { Page, PageParams } from "@/types/api"
import type {
  CreateExcepcionRequest,
  CreateHorarioRequest,
  Disponibilidad,
  Especialidad,
  ExcepcionHorario,
  Horario,
  Tecnico,
  UpdateDocumentosRequest,
  UpdateHorarioRequest,
  UpdateTecnicoRequest,
} from "@/types/technician"

// Search/list endpoints may return either a Page or a bare array — callers
// normalize with toItems(). Hence the union return types.
type TecnicoList = Page<Tecnico> | Tecnico[]

const pageParams = (p?: PageParams, extra?: Record<string, unknown>) => ({
  params: {
    page: p?.page ?? 0,
    size: p?.size ?? 20,
    ...(p?.sort ? { sort: p.sort } : {}),
    ...extra,
  },
})

export const techniciansApi = {
  /** Specialty catalog (all available specialties). */
  specialties: () => apiGet<Especialidad[]>("/api/v1/technicians/specialties"),

  /** Specialties assigned to a given technician. */
  misEspecialidades: (idTecnico: string) =>
    apiGet<Especialidad[]>(`/api/v1/technicians/specialties/tecnico/${idTecnico}`),

  asignarEspecialidad: (idUsuarioTecnico: string, idEspecialidad: string) =>
    apiPost<void>("/api/v1/technicians/specialties/asignar", {
      idUsuarioTecnico,
      idEspecialidad,
    }),

  removerEspecialidad: (idUsuarioTecnico: string, idEspecialidad: string) =>
    apiDelete<void>(
      `/api/v1/technicians/specialties/tecnico/${idUsuarioTecnico}/especialidad/${idEspecialidad}`,
    ),

  /** Sube/actualiza el certificado que acredita una especialidad del técnico. */
  actualizarCertificadoEspecialidad: (
    idUsuarioTecnico: string,
    idEspecialidad: string,
    certificadoUrl: string,
  ) =>
    apiPatch<void>(
      `/api/v1/technicians/specialties/tecnico/${idUsuarioTecnico}/especialidad/${idEspecialidad}/certificado`,
      { certificadoUrl },
    ),

  detalle: (id: string) => apiGet<Tecnico>(`/api/v1/technicians/${id}/detalle`),

  update: (idUsuario: string, body: UpdateTecnicoRequest) =>
    apiPut<Tecnico>(`/api/v1/technicians/${idUsuario}`, body),

  updateDocumentos: (idUsuario: string, body: UpdateDocumentosRequest) =>
    apiPatch<Tecnico>(`/api/v1/technicians/${idUsuario}/documentos`, body),

  updateDisponibilidad: (idUsuario: string, disponibilidad: Disponibilidad) =>
    apiPatch<Tecnico>(`/api/v1/technicians/${idUsuario}/disponibilidad`, { disponibilidad }),

  // ⚠️ Location is set via QUERY PARAM, not a body.
  updateLocation: (idUsuario: string, idUbicacion: string) =>
    apiPut<Tecnico>(`/api/v1/technicians/${idUsuario}/location`, undefined, {
      params: { idUbicacion },
    }),

  buscarPorEspecialidad: (idEspecialidad: string, p?: PageParams) =>
    apiGet<TecnicoList>("/api/v1/technicians/buscar/especialidad", pageParams(p, { idEspecialidad })),

  buscarPorDisponibilidad: (disponibilidad: Disponibilidad, p?: PageParams) =>
    apiGet<TecnicoList>("/api/v1/technicians/buscar/disponibilidad", pageParams(p, { disponibilidad })),

  availableByUbicacion: (idUbicacion: string) =>
    apiGet<TecnicoList>(`/api/v1/technicians/location/${idUbicacion}/available-approved`),

  /* ------------------------------ Agenda --------------------------------- */

  /** Weekly recurring schedule of a technician. */
  horarios: (idTecnico: string) =>
    apiGet<Horario[]>(`/api/v1/technicians/schedules/tecnico/${idTecnico}`),

  crearHorario: (body: CreateHorarioRequest) =>
    apiPost<Horario>("/api/v1/technicians/schedules", body),

  actualizarHorario: (idHorario: string, body: UpdateHorarioRequest) =>
    apiPut<Horario>(`/api/v1/technicians/schedules/${idHorario}`, body),

  eliminarHorario: (idHorario: string) =>
    apiDelete<void>(`/api/v1/technicians/schedules/${idHorario}`),

  /** Day-off / unavailability windows. */
  excepciones: (idTecnico: string) =>
    apiGet<ExcepcionHorario[]>(
      `/api/v1/technicians/schedule-exceptions/tecnico/${idTecnico}`,
    ),

  crearExcepcion: (body: CreateExcepcionRequest) =>
    apiPost<ExcepcionHorario>("/api/v1/technicians/schedule-exceptions", body),

  eliminarExcepcion: (idExcepcion: string) =>
    apiDelete<void>(`/api/v1/technicians/schedule-exceptions/${idExcepcion}`),
}
