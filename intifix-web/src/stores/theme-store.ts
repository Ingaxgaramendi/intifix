import { create } from "zustand"
import { persist } from "zustand/middleware"

export type Theme = "light" | "dark"

/** Toggle the `dark` class on <html> so the .dark tokens in index.css apply. */
function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark")
}

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggle: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "light",
      setTheme: (theme) => {
        applyTheme(theme)
        set({ theme })
      },
      toggle: () => get().setTheme(get().theme === "dark" ? "light" : "dark"),
    }),
    {
      name: "intifix-theme",
      // Re-apply the persisted theme to <html> once localStorage is read.
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme)
      },
    },
  ),
)
