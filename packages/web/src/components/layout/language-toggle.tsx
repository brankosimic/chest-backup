"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Check, ChevronDown, Globe } from "lucide-react"
import { cn } from "@/lib/utils"
import type { LanguageCode, LanguageOption } from "@/types/ui"
import * as styles from "./language-toggle.styles"

const LANGUAGES: LanguageOption[] = [
  { code: "en", labelKey: "nav.languages.en" },
  { code: "bs", labelKey: "nav.languages.bs" },
]

const LanguageToggle = () => {
  const { i18n, t } = useTranslation()
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const current = LANGUAGES.find((language) => i18n.language.startsWith(language.code)) ?? LANGUAGES[0]

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      setOpen(false)
      triggerRef.current?.focus()
    }

    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  const selectLanguage = (code: LanguageCode) => {
    void i18n.changeLanguage(code)
    setOpen(false)
  }

  const onMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]'))
    if (!items.length) return

    const index = items.indexOf(document.activeElement as HTMLButtonElement)
    let next: number | undefined
    if (event.key === "ArrowDown") next = (index + 1) % items.length
    else if (event.key === "ArrowUp") next = (index - 1 + items.length) % items.length
    else if (event.key === "Home") next = 0
    else if (event.key === "End") next = items.length - 1
    if (next === undefined) return

    event.preventDefault()
    items[next]?.focus()
  }

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setOpen((prev) => !prev)
        }}
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("nav.language")}
        title={t("nav.language")}
      >
        <Globe className={styles.globe} />
        <span className={styles.label}>{t(current.labelKey)}</span>
        <span className={styles.code}>{current.code.toUpperCase()}</span>
        <ChevronDown className={cn(styles.chevron, open && styles.chevronOpen)} />
      </button>

      {open && (
        <div role="menu" aria-label={t("nav.language")} className={styles.menu} onKeyDown={onMenuKeyDown}>
          {LANGUAGES.map((language) => {
            const isActive = language.code === current.code
            return (
              <button
                key={language.code}
                type="button"
                role="menuitemradio"
                aria-checked={isActive}
                onClick={() => {
                  selectLanguage(language.code)
                }}
                className={cn(styles.option, isActive && styles.optionActive)}
              >
                <span>{t(language.labelKey)}</span>
                <Check className={cn(styles.check, !isActive && styles.checkHidden)} />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export { LanguageToggle }
