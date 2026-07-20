"use client"

import { useTranslation } from "react-i18next"

const LanguageToggle = () => {
  const { i18n } = useTranslation()

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "bs" : "en"
    void i18n.changeLanguage(newLang)
  }

  return (
    <button
      onClick={toggleLanguage}
      className="flex h-10 w-10 items-center justify-center rounded-md border transition-colors hover:bg-accent"
      aria-label="Toggle language"
      title="Toggle language"
    >
      <span className="text-sm font-semibold">{i18n.language === "en" ? "BS" : "EN"}</span>
    </button>
  )
}

export { LanguageToggle }
