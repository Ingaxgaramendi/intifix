import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { ProtectedRoute, RequirePermission } from "@/components/guards";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoadingState } from "@/components/ui/feedback";
import { ToastContainer } from "@/components/ui/toast";
import { LoginPage } from "@/features/auth/LoginPage";
import { ToastProvider } from "@/lib/toast";
import { Permission } from "@/lib/rbac";

const DashboardPage = lazy(() =>
  import("@/features/dashboard/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);
const UsuariosPage = lazy(() =>
  import("@/features/usuarios/UsuariosPage").then((m) => ({ default: m.UsuariosPage })),
);
const TecnicosPage = lazy(() =>
  import("@/features/tecnicos/TecnicosPage").then((m) => ({ default: m.TecnicosPage })),
);
const ReportesPage = lazy(() =>
  import("@/features/reportes/ReportesPage").then((m) => ({ default: m.ReportesPage })),
);
const ApelacionesPage = lazy(() =>
  import("@/features/apelaciones/ApelacionesPage").then((m) => ({ default: m.ApelacionesPage })),
);
const AuditoriaPage = lazy(() =>
  import("@/features/auditoria/AuditoriaPage").then((m) => ({ default: m.AuditoriaPage })),
);
const ConfiguracionPage = lazy(() =>
  import("@/features/configuracion/ConfiguracionPage").then((m) => ({
    default: m.ConfiguracionPage,
  })),
);

function guarded(permission: Permission, element: React.ReactNode) {
  return (
    <RequirePermission permission={permission}>
      <Suspense fallback={<LoadingState />}>{element}</Suspense>
    </RequirePermission>
  );
}

export function App() {
  return (
    <ToastProvider>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={guarded(Permission.DASHBOARD_VIEW, <DashboardPage />)} />
          <Route path="usuarios" element={guarded(Permission.USERS_VIEW, <UsuariosPage />)} />
          <Route path="tecnicos" element={guarded(Permission.TECHNICIANS_VIEW, <TecnicosPage />)} />
          <Route path="reportes" element={guarded(Permission.REPORTS_VIEW, <ReportesPage />)} />
          <Route path="apelaciones" element={guarded(Permission.REPORTS_VIEW, <ApelacionesPage />)} />
          <Route path="auditoria" element={guarded(Permission.AUDIT_VIEW, <AuditoriaPage />)} />
          <Route
            path="configuracion"
            element={
              <Suspense fallback={<LoadingState />}>
                <ConfiguracionPage />
              </Suspense>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  );
}
