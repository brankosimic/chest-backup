import { useCallback, useEffect, useState } from "react"
import type { Theme } from "@/types/ui"

const STORAGE_KEY = "chest-backup.theme"
const QUERY = "(prefers-color-scheme: dark)"
const THEME_EVENT = "chest-backup:theme"

const getStoredTheme = (): Theme => {
  if (typeof window === "undefined") return "system"
  const value = window.localStorage.getItem(STORAGE_KEY)
  return value === "light" || value === "dark" ? value : "system"
}

const systemPrefersDark = (): boolean =>
  typeof window !== "undefined" && window.matchMedia(QUERY).matches

const resolveTheme = (theme: Theme): "light" | "dark" =>
  theme === "system" ? (systemPrefersDark() ? "dark" : "light") : theme

const applyTheme = (theme: Theme): void => {
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

const syncFromSystem = (): void => {
  if (getStoredTheme() === "system") applyTheme("system")
}

const useThemeSync = (onChange: () => void): void => {
  useEffect(() => {
    const media = window.matchMedia(QUERY)
    const onStorageEvent = (event: StorageEvent): void => {
      if (event.key === STORAGE_KEY || event.key === null) onChange()
    }

    syncFromSystem()
    media.addEventListener("change", syncFromSystem)
    window.addEventListener(THEME_EVENT, onChange)
    window.addEventListener("storage", onStorageEvent)
    return () => {
      media.removeEventListener("change", syncFromSystem)
      window.removeEventListener(THEME_EVENT, onChange)
      window.removeEventListener("storage", onStorageEvent)
    }
  }, [onChange])
}

const useTheme = () => {
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme())

  useThemeSync(() => {
    setThemeState(getStoredTheme())
  })

  const changeTheme = useCallback((next: Theme): void => {
    setTheme(next)
  }, [])

  return { theme, resolved: resolveTheme(theme), setTheme: changeTheme }
}

export { useTheme, useThemeSync, getStoredTheme, applyTheme, QUERY, THEME_EVENT }
