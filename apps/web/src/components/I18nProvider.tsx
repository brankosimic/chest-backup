"use client"

import { I18nextProvider } from "react-i18next"
import i18next from "i18next"
import { initReactI18next } from "react-i18next"
import en from "@/locales/en/translation.json"
import bs from "@/locales/bs/translation.json"

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

export function I18nProvider({ children }: { children: React.ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
