"use client"

import { useTranslation } from "react-i18next"

const Header = ({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) => {
  const { t } = useTranslation()

  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t(title)}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{t(subtitle)}</p>}
      </div>
      {action && <div>{action}</div>}
    </header>
  )
}

export { Header }
