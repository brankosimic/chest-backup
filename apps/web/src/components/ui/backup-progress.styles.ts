const cardHeader = "flex flex-row items-center justify-between space-y-0 pb-2"
const headerGroup = "flex items-center gap-2"
const headerStats = "flex items-center gap-3 text-xs text-muted-foreground"
const archivingRow = "flex items-center gap-2 text-sm text-muted-foreground"
const progressTrack = "relative h-2 overflow-hidden rounded-full bg-muted"
const progressBarBase = "h-full rounded-full transition-all duration-700 ease-out"
const progressBarDone = "bg-blue-500"
const progressBarActive = "bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 bg-[length:200%_100%] animate-shimmer"
const barRipple = "absolute inset-0 flex items-center justify-end overflow-hidden rounded-full"
const barRippleInner = "h-full w-12 origin-right animate-bar-ripple rounded-full bg-blue-400/40"
const destRow = "flex flex-col gap-1 rounded-lg border p-2.5 text-sm transition-colors"
const destRowUploading = "border-blue-400/60 bg-blue-500/5 shadow-[0_0_12px_-4px_rgba(59,130,246,0.25)]"
const destRowDone = "border-green-200 dark:border-green-900/50"
const destRowError = "border-red-200 dark:border-red-900/50"
const destBadge = "flex items-center gap-1 text-[10px] px-1.5 py-0"
const speedLabel = "text-xs text-muted-foreground whitespace-nowrap tabular-nums"

export {
  cardHeader,
  headerGroup,
  headerStats,
  archivingRow,
  progressTrack,
  progressBarBase,
  progressBarDone,
  progressBarActive,
  barRipple,
  barRippleInner,
  destRow,
  destRowUploading,
  destRowDone,
  destRowError,
  destBadge,
  speedLabel,
}
