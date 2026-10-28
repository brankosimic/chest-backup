import { useCallback, useEffect, useState } from "react"

export type Theme = "light" | "dark" | "system"

export const STORAGE_KEY = "chest-backup.theme"
export const QUERY = "(prefers-color-scheme: dark)"
export const THEME_EVENT = "chest-backup:theme"

export const getStoredTheme = (): Theme => {
  if (typeof window === "undefined") return "system"
  const value = window.localStorage.getItem(STORAGE_KEY)
  return value === "light" || value === "dark" ? value : "system"
}

const systemPrefersDark = (): boolean =>
  typeof window !== "undefined" && window.matchMedia(QUERY).matches

export const resolveTheme = (theme: Theme): "light" | "dark" =>
  theme === "system" ? (systemPrefersDark() ? "dark" : "light") : theme

export const applyTheme = (theme: Theme): void => {
  if (typeof document === "undefined") return
  document.documentElement.classList.toggle("dark", resolveTheme(theme) === "dark")
}

const setTheme = (theme: Theme): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, theme)
  } catch (error) {
    console.error("failed to persist theme preference", error)
  }
  applyTheme(theme)
  window.dispatchEvent(new Event(THEME_EVENT))
}

export const useTheme = () => {
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme())

  useEffect(() => {
    const media = window.matchMedia(QUERY)
    const syncFromSystem = (): void => {
      if (getStoredTheme() === "system") applyTheme("system")
    }
    const onStorageEvent = (event: StorageEvent): void => {
      if (event.key === STORAGE_KEY || event.key === null) setThemeState(getStoredTheme())
    }
    const onThemeEvent = (): void => {
      setThemeState(getStoredTheme())
    }

    syncFromSystem()
    media.addEventListener("change", syncFromSystem)
    window.addEventListener(THEME_EVENT, onThemeEvent)
    window.addEventListener("storage", onStorageEvent)
    return () => {
      media.removeEventListener("change", syncFromSystem)
      window.removeEventListener(THEME_EVENT, onThemeEvent)
      window.removeEventListener("storage", onStorageEvent)
    }
  }, [])

  const changeTheme = useCallback((next: Theme): void => {
    setTheme(next)
  }, [])

  return { theme, resolved: resolveTheme(theme), setTheme: changeTheme }
}
