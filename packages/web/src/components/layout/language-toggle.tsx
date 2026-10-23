"use client"

import { useTranslation } from "react-i18next"

const LanguageToggle = () => {
  const { i18n, t } = useTranslation()
  const nextLanguage = i18n.language === "en" ? "bs" : "en"

  return (
    <button
      type="button"
      onClick={() => {
        void i18n.changeLanguage(nextLanguage)
      }}
      className="flex h-10 items-center justify-center rounded-md border px-3 text-sm font-semibold transition-colors hover:bg-accent cursor-pointer"
      aria-label={t("nav.language")}
      title={t("nav.language")}
    >
      {nextLanguage.toUpperCase()}
    </button>
  )
}

export { LanguageToggle }
