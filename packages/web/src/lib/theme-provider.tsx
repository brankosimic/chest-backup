import { useCallback } from "react"
import { useThemeSync, getStoredTheme, applyTheme } from "@/lib/theme"
import type { ThemeProviderProps } from "@/types/ui"

const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const sync = useCallback(() => {
    applyTheme(getStoredTheme())
  }, [])
  useThemeSync(sync)

  return <>{children}</>
}

export { ThemeProvider }
