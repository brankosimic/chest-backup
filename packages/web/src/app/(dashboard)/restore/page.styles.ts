const page = "mx-auto max-w-[90rem] space-y-6"
const grid = "grid gap-4 lg:grid-cols-[repeat(3,minmax(0,1fr))] [&>*]:min-w-0"
const hint = "text-xs text-muted-foreground"
const label = "mb-1 block text-sm font-medium"
const searchWrap = "relative"
const searchIcon = "pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
const fileToolbar = "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
const fileMeta = "flex items-center gap-3 text-xs text-muted-foreground"
const switchRow = "flex items-center justify-between gap-3 rounded-lg border p-3"
const restoreButton = "w-full"
const jobCard = ""
const jobCardRunning = "border-blue-500/50 animate-pulse-glow"
const jobCardFailed = "border-red-500/50"
const jobCardDone = "border-green-500/50"
const liveDot = "relative flex h-2.5 w-2.5 shrink-0"
const liveDotPing = "absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"
const liveDotCore = "relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-500"
const destIcon = "h-3.5 w-3.5"
const jobHeaderRow = "flex flex-row flex-wrap items-center justify-between gap-x-3 space-y-0 pb-2"
const jobTitleGroup = "flex min-w-0 items-center gap-2"
const jobHeaderStats = "flex items-center gap-3 text-xs text-muted-foreground"
const jobMeta = "flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground"
const progressTrack = "relative h-2 w-full overflow-hidden rounded-full bg-muted"
const progressBarBase = "h-full rounded-full transition-all duration-700 ease-out"
const progressBarActive = "bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 bg-[length:200%_100%] animate-shimmer"
const progressBarDone = "bg-green-500"
const progressBarFailed = "bg-red-500"
const barRipple = "absolute inset-0 flex items-center justify-end overflow-hidden rounded-full"
const barRippleInner = "h-full w-12 origin-right animate-bar-ripple rounded-full bg-blue-400/40"
const statGrid = "grid grid-cols-2 gap-3 sm:grid-cols-4"
const statBox = "rounded-lg border p-3"
const statValue = "text-lg font-semibold"
const statLabel = "text-xs text-muted-foreground"
const currentFile = "flex items-center gap-2 truncate rounded-md bg-muted px-2 py-1 font-mono text-xs"
const errorList = "max-h-40 space-y-1 overflow-auto rounded-md border border-destructive/40 bg-destructive/5 p-2"
const errorItem = "break-all text-xs text-destructive"
const sectionTitle = "text-sm font-medium"
const emptyText = "py-8 text-center text-sm text-muted-foreground"
const progressMeta = "mt-1 text-xs text-muted-foreground"
const cardContent = "space-y-4"
const skeletonList = "space-y-2.5"
const skeletonRow = "h-8 rounded-md bg-gradient-to-r from-muted via-muted/60 to-muted bg-[length:200%_100%] animate-skeleton-shimmer"
const fileTreeWrap = "flex flex-col gap-3 animate-fade-in-up"
const searchInput = "pl-8"
const fieldHint = "mt-1 text-xs text-muted-foreground"
const busyHint = "flex items-center gap-1 text-xs text-muted-foreground"
const busyIcon = "h-3 w-3"
const emptyState = "py-8 text-center text-sm text-muted-foreground"
const emptyIcon = "mx-auto mb-2 h-6 w-6 text-muted-foreground"
const confirmRow = "flex items-center justify-between gap-3 rounded-lg border p-3"
const confirmLabel = "text-xs font-medium text-muted-foreground"
const confirmValue = "flex min-w-0 items-center gap-1.5 truncate text-sm"
const confirmNote = "rounded-md bg-blue-500/10 px-3 py-2 text-xs text-blue-600 dark:text-blue-400"

export {
  page,
  grid,
  hint,
  label,
  searchWrap,
  searchIcon,
  fileToolbar,
  fileMeta,
  switchRow,
  restoreButton,
  jobCard,
  jobCardRunning,
  jobCardFailed,
  jobCardDone,
  liveDot,
  liveDotPing,
  liveDotCore,
  destIcon,
  jobHeaderRow,
  jobTitleGroup,
  jobHeaderStats,
  jobMeta,
  progressTrack,
  progressBarBase,
  progressBarActive,
  progressBarDone,
  progressBarFailed,
  barRipple,
  barRippleInner,
  statGrid,
  statBox,
  statValue,
  statLabel,
  currentFile,
  errorList,
  errorItem,
  sectionTitle,
  emptyText,
  progressMeta,
  cardContent,
  skeletonList,
  skeletonRow,
  fileTreeWrap,
  searchInput,
  fieldHint,
  busyHint,
  busyIcon,
  emptyState,
  emptyIcon,
  confirmRow,
  confirmLabel,
  confirmValue,
  confirmNote,
}
