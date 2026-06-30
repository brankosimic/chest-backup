import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import en from "@/locales/en.json"
import bs from "@/locales/bs.json"

const detectedLanguage = (() => {
  if (typeof window === "undefined") return "en"
  const stored = localStorage.getItem("chest-backup-lang")

  if (stored) return stored
  const browserLang = navigator.language ?? "en"

  return browserLang.startsWith("bs") ? "bs" : "en"
})()

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    bs: { translation: bs },
  },
  lng: detectedLanguage,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
})

export { i18n }
