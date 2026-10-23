import { cn } from "@/lib/utils"
import type { StatTileProps } from "@/types/backup"
import { StatTileTone } from "@/types/backup"
import * as styles from "./stat-tile.styles"

const toneClass = (tone: StatTileTone): string => {
  if (tone === StatTileTone.Success) return styles.toneSuccess
  if (tone === StatTileTone.Warning) return styles.toneWarning
  if (tone === StatTileTone.Destructive) return styles.toneDestructive
  return styles.toneDefault
}

const StatTile = ({ title, value, hint, icon, tone = StatTileTone.Default }: StatTileProps) => (
  <div className={styles.tile}>
    <div className={styles.label}>
      {icon}
      <span className="truncate">{title}</span>
    </div>
    <p className={cn(styles.value, toneClass(tone))}>{value}</p>
    {hint && <p className={styles.hint}>{hint}</p>}
  </div>
)

export { StatTile }
