import { cn } from "@/lib/utils"
import type { TooltipProps } from "@/types/ui"
import * as styles from "./tooltip.styles"

const Tooltip = ({ children, content, side = "top", className }: TooltipProps) => (
  <span className={cn(styles.wrapper, className)}>
    {children}
    <span role="tooltip" className={cn(styles.bubble, side === "top" ? styles.bubbleTop : styles.bubbleBottom)}>
      {content}
    </span>
  </span>
)

export { Tooltip }
