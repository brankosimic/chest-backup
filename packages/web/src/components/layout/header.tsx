"use client"

import { useTranslation } from "react-i18next"
import type { HeaderProps } from "@/types/ui"

const Header = ({ title, subtitle, action }: HeaderProps) => {
  const { t } = useTranslation()

  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t(title)}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{t(subtitle)}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </header>
  )
}

export { Header }
