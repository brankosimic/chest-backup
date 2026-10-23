import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { X } from "lucide-react"
import type { SheetProps } from "@/types/ui"
import * as styles from "./sheet.styles"

const Sheet = ({ open, onClose, title, description, footer, children, className }: SheetProps) => {
  const { t } = useTranslation()

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }

    document.addEventListener("keydown", onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <button type="button" aria-label={t("common.close")} onClick={onClose} className={styles.overlay} />
      <div className={`${styles.panel} ${className ?? ""}`}>
        {(title || description) && (
          <div className={styles.header}>
            <div className={styles.headerText}>
              {title && <h2 className={styles.title}>{title}</h2>}
              {description && <span className={styles.description}>{description}</span>}
            </div>
            <button type="button" onClick={onClose} aria-label={t("common.close")} className={styles.close}>
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  )
}

export { Sheet }
