import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { EmptyState } from "@/components/ui/feedback";
import { useAuth } from "@/lib/auth";
import type { Permission } from "@/lib/rbac";
import { ShieldAlert } from "lucide-react";

/** Gate a route behind authentication. */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { principal } = useAuth();
  const location = useLocation();
  if (!principal) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}

/** Gate a route/section behind a permission (least privilege). */
export function RequirePermission({
  permission,
  children,
}: {
  permission: Permission;
  children: ReactNode;
}) {
  const { can } = useAuth();
  if (!can(permission)) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Acceso restringido"
        description="Tu rol no tiene permisos para ver esta sección."
      />
    );
  }
  return <>{children}</>;
}

/** Conditionally render children only when the principal holds the permission. */
export function Can({
  permission,
  children,
}: {
  permission: Permission;
  children: ReactNode;
}) {
  const { can } = useAuth();
  return can(permission) ? <>{children}</> : null;
}
