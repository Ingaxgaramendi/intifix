import { Toaster as SonnerToaster } from "sonner"

/** App-wide toast host. Mounted once near the root. */
export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: "rounded-xl border border-border shadow-lg",
        },
      }}
    />
  )
}
