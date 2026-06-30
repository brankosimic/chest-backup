"use client"

import { useEffect } from "react"
import { i18n } from "@/lib/i18n"

interface Props {
  children: React.ReactNode
}

const LanguageProvider = ({ children }: Props) => {
  useEffect(() => {
    const stored = localStorage.getItem("chest-backup-lang")

    if (stored) i18n.changeLanguage(stored)
  }, [])

  return children
}

export { LanguageProvider }
