"use client"

import { useState, useEffect } from "react"
import i18next from "i18next"
import { initReactI18next } from "react-i18next"
import en from "@/locales/en/translation.json"
import bs from "@/locales/bs/translation.json"

let i18nInstance: any = null

export function useClientI18n() {
  const [i18n, setI18n] = useState<any>(null)

  useEffect(() => {
    if (!i18nInstance) {
      i18nInstance = (i18next as any).createInstance()
      i18nInstance
        .use(initReactI18next)
        .init({
          resources: {
            en: { translation: en },
            bs: { translation: bs },
          },
          lng: "en",
          fallbackLng: "en",
          interpolation: { escapeValue: false },
        })
    }
    setI18n(i18nInstance)
  }, [])

  return i18n
}
