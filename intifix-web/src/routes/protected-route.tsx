import { useEffect, type ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { authApi } from "@/api/auth"
import { useAuthStore } from "@/stores/auth-store"
import { dashboardPathForRoles, paths } from "@/routes/paths"
import type { Role } from "@/types/auth"

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  )
}

/**
 * Gate for authenticated areas. Ensures a token exists, lazily resolves the
 * current user (roles) if the persisted session lacks it, and enforces role
 * access — redirecting to the user's own dashboard on mismatch.
 */
export function ProtectedRoute({
  roles,
  children,
}: {
  roles?: Role[]
  children: ReactNode
}) {
  const location = useLocation()
  const { accessToken, user, setUser, clearSession } = useAuthStore()

  // Resolve current user once if we have a token but no cached user.
  const { data, isLoading, isError } = useQuery({
    queryKey: ["current-user"],
    queryFn: authApi.currentUser,
    enabled: !!accessToken && !user,
  })

  useEffect(() => {
    if (data) setUser(data)
  }, [data, setUser])

  useEffect(() => {
    if (isError) clearSession()
  }, [isError, clearSession])

  if (!accessToken) {
    return <Navigate to={paths.login} replace state={{ from: location.pathname }} />
  }

  if (!user) {
    if (isLoading) return <FullScreenLoader />
    if (isError) return <Navigate to={paths.login} replace />
    return <FullScreenLoader />
  }

  if (roles && !roles.some((r) => user.roles.includes(r))) {
    return <Navigate to={dashboardPathForRoles(user.roles)} replace />
  }

  return <>{children}</>
}
