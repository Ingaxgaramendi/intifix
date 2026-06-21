import { createBrowserRouter, Navigate } from "react-router-dom"
import { CalendarDays, BadgeCheck } from "lucide-react"
import { LandingPage } from "@/pages/public/landing"
import { LoginPage } from "@/features/auth/login-page"
import { RegisterPage } from "@/features/auth/register-page"
import { AppShell } from "@/components/layout/app-shell"
import { ProtectedRoute } from "@/routes/protected-route"
import { ClienteDashboard } from "@/features/dashboard/cliente-dashboard"
import { TecnicoDashboard } from "@/features/dashboard/tecnico-dashboard"
import { PedirServicioPage } from "@/features/services/pedir-servicio-page"
import { MisServiciosPage } from "@/features/services/mis-servicios-page"
import { ServicioDetallePage } from "@/features/services/servicio-detalle-page"
import { BuscarTecnicosPage } from "@/features/search/buscar-tecnicos-page"
import { PagosPage } from "@/features/payments/pagos-page"
import { CheckoutPage } from "@/features/payments/checkout-page"
import { ServiciosDisponiblesPage } from "@/features/technician/servicios-disponibles-page"
import { MisCotizacionesPage } from "@/features/technician/mis-cotizaciones-page"
import { MisAsignacionesPage } from "@/features/technician/mis-asignaciones-page"
import { ReputacionPage } from "@/features/calificaciones/reputacion-page"
import { ClientePerfilPage } from "@/features/profile/cliente-perfil-page"
import { TecnicoPerfilPage } from "@/features/profile/tecnico-perfil-page"
import { TecnicoUbicacionPage } from "@/features/profile/tecnico-ubicacion-page"
import { ChatPage } from "@/features/chat/chat-page"
import { NotificacionesPage } from "@/features/notifications/notificaciones-page"
import { PagePlaceholder } from "@/components/feedback/page-placeholder"
import { paths } from "@/routes/paths"

export const router = createBrowserRouter([
  { path: paths.landing, element: <LandingPage /> },
  { path: paths.login, element: <LoginPage /> },
  { path: paths.register, element: <RegisterPage /> },

  // ---- CLIENTE area ----
  {
    element: (
      <ProtectedRoute roles={["CLIENTE"]}>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { path: paths.cliente.dashboard, element: <ClienteDashboard /> },
      { path: paths.cliente.perfil, element: <ClientePerfilPage /> },
      { path: paths.cliente.pedir, element: <PedirServicioPage /> },
      { path: paths.cliente.servicios, element: <MisServiciosPage /> },
      { path: paths.cliente.servicioDetalle(), element: <ServicioDetallePage /> },
      { path: paths.cliente.buscarTecnicos, element: <BuscarTecnicosPage /> },
      { path: paths.cliente.pagos, element: <PagosPage /> },
      { path: paths.cliente.pago(), element: <CheckoutPage /> },
    ],
  },

  // ---- TECNICO area ----
  {
    element: (
      <ProtectedRoute roles={["TECNICO"]}>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { path: paths.tecnico.dashboard, element: <TecnicoDashboard /> },
      { path: paths.tecnico.perfil, element: <TecnicoPerfilPage /> },
      { path: paths.tecnico.especialidades, element: <PagePlaceholder title="Mis especialidades" icon={BadgeCheck} /> },
      { path: paths.tecnico.agenda, element: <PagePlaceholder title="Mi agenda" icon={CalendarDays} /> },
      { path: paths.tecnico.disponibles, element: <ServiciosDisponiblesPage /> },
      { path: paths.tecnico.cotizaciones, element: <MisCotizacionesPage /> },
      { path: paths.tecnico.asignaciones, element: <MisAsignacionesPage /> },
      { path: paths.tecnico.reputacion, element: <ReputacionPage /> },
      { path: paths.tecnico.ubicacion, element: <TecnicoUbicacionPage /> },
    ],
  },

  // ---- Shared (any authenticated role) ----
  {
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { path: paths.shared.chat, element: <ChatPage /> },
      { path: paths.shared.notificaciones, element: <NotificacionesPage /> },
    ],
  },

  { path: "*", element: <Navigate to={paths.landing} replace /> },
])
