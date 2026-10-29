import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import type { ConfirmDialogProps } from "@/types/ui"
import * as styles from "./confirm-dialog.styles"

const ConfirmDialog = ({ open, title, description, children, confirmLabel, cancelLabel, onConfirm, onCancel }: ConfirmDialogProps) => {
  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") onCancel()
    }

    document.addEventListener("keydown", onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.panel}>
        <h2 className={styles.title}>{title}</h2>
        {description && <p className={styles.description}>{description}</p>}
        {children && <div className={styles.content}>{children}</div>}
        <div className={styles.actions}>
          <Button variant="outline" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

export { ConfirmDialog }
