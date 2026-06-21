import axios from "axios"
import type { ApiResponse } from "@/types/api"
import { useAuthStore } from "@/stores/auth-store"

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080"

export const uploadsApi = {
  /**
   * Sube una imagen (multipart) y devuelve la URL absoluta donde quedó alojada.
   * Usa axios "pelado" para que el navegador fije el Content-Type multipart con
   * su boundary (la instancia compartida fuerza application/json).
   */
  image: async (file: File): Promise<string> => {
    const form = new FormData()
    form.append("file", file)
    const token = useAuthStore.getState().accessToken
    const res = await axios.post<ApiResponse<{ url: string }>>(
      `${BASE_URL}/api/v1/uploads`,
      form,
      { headers: token ? { Authorization: `Bearer ${token}` } : undefined },
    )
    return res.data.data.url
  },
}
