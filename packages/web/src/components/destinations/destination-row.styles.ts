const linkShell = "block"
const cardShell = "relative transition-colors hover:border-primary"
const body = "flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:gap-8"

const identity = "flex min-w-0 items-center gap-3 lg:w-60 lg:shrink-0"
const iconWrap = "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground"
const icon = "h-5 w-5"
const titleBlock = "min-w-0 flex-1"
const titleRow = "flex flex-wrap items-center gap-2"
const title = "truncate text-sm font-semibold"
const skippedBadge = "shrink-0"
const subtitle = "mt-0.5 truncate text-xs text-muted-foreground"
const unavailableIcon = "h-4 w-4 shrink-0 text-destructive"

const stats = "flex shrink-0 gap-6"
const statGroup = "flex flex-col"
const statValue = "text-xl font-bold tabular-nums leading-tight"
const statLabel = "text-xs text-muted-foreground"

const disk = "min-w-0 flex-1 space-y-1.5"
const row = "flex items-center justify-between gap-3 text-xs"
const rowLabel = "shrink-0 text-muted-foreground"
const rowValue = "font-medium tabular-nums whitespace-nowrap"
const barTrack = "h-2 w-full overflow-hidden rounded-full bg-muted"
const diskBar = "h-full rounded-full bg-primary transition-all"

const details = "flex shrink-0 flex-col gap-2 lg:w-72"
const detailRow = "flex items-center justify-between gap-4 text-xs"
const detailLabel = "shrink-0 text-muted-foreground"
const detailValue = "max-w-[14rem] truncate font-medium text-right"
const duration = "inline-flex items-center gap-1.5 whitespace-nowrap"
const clockIcon = "h-3 w-3 text-muted-foreground"

const skeletonBase =
  "animate-skeleton-shimmer rounded bg-[linear-gradient(90deg,var(--muted)_25%,color-mix(in_srgb,var(--muted)_40%,var(--background))_50%,var(--muted)_75%)] bg-[length:200%_100%]"
const skeletonValue = `${skeletonBase} h-6 w-12`
const skeletonValueWide = `${skeletonBase} h-6 w-20`
const skeletonText = `${skeletonBase} h-3 w-14`
const skeletonTextWide = `${skeletonBase} h-3 w-24`
const skeletonBar = `w-full ${skeletonBase}`

export {
  linkShell,
  cardShell,
  body,
  identity,
  iconWrap,
  icon,
  titleBlock,
  titleRow,
  title,
  skippedBadge,
  subtitle,
  unavailableIcon,
  stats,
  statGroup,
  statValue,
  statLabel,
  disk,
  row,
  rowLabel,
  rowValue,
  barTrack,
  diskBar,
  details,
  detailRow,
  detailLabel,
  detailValue,
  duration,
  clockIcon,
  skeletonValue,
  skeletonValueWide,
  skeletonText,
  skeletonTextWide,
  skeletonBar,
}
