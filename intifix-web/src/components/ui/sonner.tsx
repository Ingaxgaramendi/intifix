import { Toaster as SonnerToaster } from "sonner"
import { useThemeStore } from "@/stores/theme-store"

/** App-wide toast host. Mounted once near the root. */
export function Toaster() {
  const theme = useThemeStore((s) => s.theme)
  return (
    <SonnerToaster
      position="top-right"
      richColors
      closeButton
      theme={theme}
      toastOptions={{
        classNames: {
          toast: "rounded-xl border border-border shadow-lg",
        },
      }}
    />
  )
}
