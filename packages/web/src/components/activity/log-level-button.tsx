import type { LogLevelButtonProps } from "@/types/ui"
import * as styles from "./log-level-button.styles"

const LogLevelButton = ({ level, active, onToggle }: LogLevelButtonProps) => (
  <button
    type="button"
    onClick={() => {
      onToggle(level)
    }}
    className={active ? styles.active : styles.inactive}
  >
    {level}
  </button>
)

export { LogLevelButton }
