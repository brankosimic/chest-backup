import { useEffect, type ReactNode } from "react"
import { getStoredTheme, applyTheme, QUERY, THEME_EVENT } from "@/lib/theme"

const ThemeProvider = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    const media = window.matchMedia(QUERY)
    const syncFromSystem = (): void => {
      if (getStoredTheme() === "system") applyTheme("system")
    }
    const onStorageEvent = (event: StorageEvent): void => {
      if (event.key === "chest-backup.theme" || event.key === null) applyTheme(getStoredTheme())
    }
    const onThemeEvent = (): void => {
      applyTheme(getStoredTheme())
    }

    applyTheme(getStoredTheme())
    media.addEventListener("change", syncFromSystem)
    window.addEventListener(THEME_EVENT, onThemeEvent)
    window.addEventListener("storage", onStorageEvent)
    return () => {
      media.removeEventListener("change", syncFromSystem)
      window.removeEventListener(THEME_EVENT, onThemeEvent)
      window.removeEventListener("storage", onStorageEvent)
    }
  }, [])

  return <>{children}</>
}

export { ThemeProvider }
