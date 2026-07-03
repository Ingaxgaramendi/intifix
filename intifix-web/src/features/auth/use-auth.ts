import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { authApi } from "@/api/auth"
import { techniciansApi } from "@/api/technicians"
import { useAuthStore } from "@/stores/auth-store"
import { queryClient } from "@/lib/query-client"
import { dashboardPathForRoles, paths } from "@/routes/paths"
import type { AuthTokens, LoginRequest, RegisterRequest } from "@/types/auth"

/** After tokens are stored, resolve the current user (roles) and persist it. */
async function resolveSession(tokens: AuthTokens) {
  const { setTokens, setUser } = useAuthStore.getState()
  setTokens(tokens)
  const user = await authApi.currentUser()
  setUser(user)
  return user
}

export function useLogin() {
  const navigate = useNavigate()
  return useMutation({
    mutationFn: async (body: LoginRequest) => resolveSession(await authApi.login(body)),
    onSuccess: (user) => {
      toast.success("Bienvenido de vuelta")
      navigate(dashboardPathForRoles(user.roles), { replace: true })
    },
  })
}

export function useRegister() {
  const navigate = useNavigate()
  return useMutation({
    mutationFn: async ({
      especialidades,
      ...body
    }: RegisterRequest & { especialidades?: string[] }) => {
      const user = await resolveSession(await authApi.register(body))
      // For technicians, assign the chosen specialties right after the account
      // exists. Best-effort: a failed specialty must not fail the registration.
      const idUsuario = user.idUsuario
      if (especialidades?.length && user.roles?.includes("TECNICO") && idUsuario) {
        await Promise.all(
          especialidades.map((id) =>
            techniciansApi.asignarEspecialidad(idUsuario, id).catch(() => undefined),
          ),
        )
      }
      return user
    },
    onSuccess: (user) => {
      toast.success("Cuenta creada con éxito")
      navigate(dashboardPathForRoles(user.roles), { replace: true })
    },
  })
}

export function useLogout() {
  const navigate = useNavigate()
  return useMutation({
    mutationFn: async () => {
      const { refreshToken } = useAuthStore.getState()
      if (refreshToken) {
        // Best-effort; ignore failures so logout always proceeds locally.
        await authApi.logout(refreshToken).catch(() => undefined)
      }
    },
    onSettled: () => {
      useAuthStore.getState().clearSession()
      queryClient.clear()
      navigate(paths.login, { replace: true })
    },
  })
}
