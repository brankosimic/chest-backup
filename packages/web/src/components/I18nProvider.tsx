"use client"

import { I18nextProvider } from "react-i18next"
import i18next from "i18next"
import { initReactI18next } from "react-i18next"
import en from "@/locales/en/translation.json"
import bs from "@/locales/bs/translation.json"
import type { ReactNode } from "react"

const i18n = i18next.createInstance()
void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    bs: { translation: bs },
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
})

interface I18nProviderProps {
  children: ReactNode
}

const I18nProvider = ({ children }: I18nProviderProps) => {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}

export { I18nProvider }
