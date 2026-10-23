import { cn } from "@/lib/utils"
import type { EmptyStateProps } from "@/types/ui"
import * as styles from "./empty-state.styles"

const EmptyState = ({ icon, title, description, action, className }: EmptyStateProps) => (
  <div className={cn(styles.wrapper, className)}>
    {icon && <div className={styles.icon}>{icon}</div>}
    <p className={styles.title}>{title}</p>
    {description && <p className={styles.description}>{description}</p>}
    {action && <div className={styles.action}>{action}</div>}
  </div>
)

export { EmptyState }
