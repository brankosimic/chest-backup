"use client"

import { I18nextProvider } from "react-i18next"
import i18next from "i18next"
import { initReactI18next } from "react-i18next"
import en from "@/locales/en/translation.json"
import bs from "@/locales/bs/translation.json"
import type { ReactNode } from "react"
import { setLocale } from "@/lib/utils"

const STORAGE_KEY = "chest-backup.language"

const savedLanguage = (): string => {
  if (typeof window === "undefined") return "en"
  return window.localStorage.getItem(STORAGE_KEY) ?? "en"
}

setLocale(savedLanguage())

const i18n = i18next.createInstance()
void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    bs: { translation: bs },
  },
  lng: savedLanguage(),
  fallbackLng: "en",
  interpolation: { escapeValue: false },
})

i18n.on("languageChanged", (language: string) => {
  setLocale(language)
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, language)
})

interface I18nProviderProps {
  children: ReactNode
}

const I18nProvider = ({ children }: I18nProviderProps) => {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}

export { I18nProvider }
