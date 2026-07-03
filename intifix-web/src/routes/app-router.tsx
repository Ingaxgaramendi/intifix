import { createBrowserRouter, Navigate } from "react-router-dom"
import { LandingPage } from "@/pages/public/landing"
import { AboutPage } from "@/pages/public/about"
import { PricingPage } from "@/pages/public/pricing"
import { LoginPage } from "@/features/auth/login-page"
import { RegisterPage } from "@/features/auth/register-page"
import { ResetPasswordPage } from "@/features/auth/reset-password-page"
import { AppShell } from "@/components/layout/app-shell"
import { ProtectedRoute } from "@/routes/protected-route"
import { ClienteDashboard } from "@/features/dashboard/cliente-dashboard"
import { TecnicoDashboard } from "@/features/dashboard/tecnico-dashboard"
import { PedirServicioPage } from "@/features/services/pedir-servicio-page"
import { MisServiciosPage } from "@/features/services/mis-servicios-page"
import { ServicioDetallePage } from "@/features/services/servicio-detalle-page"
import { BuscarTecnicosPage } from "@/features/search/buscar-tecnicos-page"
import { TecnicoPerfilPublicoPage } from "@/features/technician/tecnico-perfil-publico-page"
import { ClientePerfilPublicoPage } from "@/features/technician/cliente-perfil-publico-page"
import { PagosPage } from "@/features/payments/pagos-page"
import { CheckoutPage } from "@/features/payments/checkout-page"
import { ServiciosDisponiblesPage } from "@/features/technician/servicios-disponibles-page"
import { SolicitudesDirectasPage } from "@/features/technician/solicitudes-directas-page"
import { MisCotizacionesPage } from "@/features/technician/mis-cotizaciones-page"
import { CotizacionDetallePage } from "@/features/technician/cotizacion-detalle-page"
import { MisAsignacionesPage } from "@/features/technician/mis-asignaciones-page"
import { AsignacionDetallePage } from "@/features/technician/asignacion-detalle-page"
import { IngresosPage } from "@/features/technician/ingresos-page"
import { ReputacionPage } from "@/features/calificaciones/reputacion-page"
import { ClientePerfilPage } from "@/features/profile/cliente-perfil-page"
import { TecnicoPerfilPage } from "@/features/profile/tecnico-perfil-page"
import { EspecialidadesPage } from "@/features/technician/especialidades-page"
import { AgendaPage } from "@/features/technician/agenda-page"
import { ChatPage } from "@/features/chat/chat-page"
import { NotificacionesPage } from "@/features/notifications/notificaciones-page"
import { AsistentePage } from "@/features/ai/asistente-page"
import { paths } from "@/routes/paths"

export const router = createBrowserRouter([
  { path: paths.landing, element: <LandingPage /> },
  { path: paths.about, element: <AboutPage /> },
  { path: paths.pricing, element: <PricingPage /> },
  { path: paths.login, element: <LoginPage /> },
  { path: paths.register, element: <RegisterPage /> },
  { path: paths.resetPassword, element: <ResetPasswordPage /> },

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
      { path: paths.cliente.tecnicoPerfil(), element: <TecnicoPerfilPublicoPage /> },
      { path: paths.cliente.miPerfilPublico, element: <ClientePerfilPublicoPage /> },
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
      { path: paths.tecnico.especialidades, element: <EspecialidadesPage /> },
      { path: paths.tecnico.agenda, element: <AgendaPage /> },
      { path: paths.tecnico.disponibles, element: <ServiciosDisponiblesPage /> },
      { path: paths.tecnico.directas, element: <SolicitudesDirectasPage /> },
      { path: paths.tecnico.clientePerfil(), element: <ClientePerfilPublicoPage /> },
      { path: paths.tecnico.miPerfilPublico, element: <TecnicoPerfilPublicoPage /> },
      { path: paths.tecnico.cotizaciones, element: <MisCotizacionesPage /> },
      { path: paths.tecnico.cotizacionDetalle(), element: <CotizacionDetallePage /> },
      { path: paths.tecnico.asignaciones, element: <MisAsignacionesPage /> },
      { path: paths.tecnico.asignacionDetalle(), element: <AsignacionDetallePage /> },
      { path: paths.tecnico.ingresos, element: <IngresosPage /> },
      { path: paths.tecnico.reputacion, element: <ReputacionPage /> },
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
      { path: paths.shared.chatConversacion(), element: <ChatPage /> },
      { path: paths.shared.notificaciones, element: <NotificacionesPage /> },
      { path: paths.shared.asistente, element: <AsistentePage /> },
    ],
  },

  { path: "*", element: <Navigate to={paths.landing} replace /> },
])
