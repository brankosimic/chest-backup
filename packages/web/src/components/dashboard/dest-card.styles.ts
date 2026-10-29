const header = "flex flex-row items-center justify-between space-y-0 pb-2"
const titleGroup = "flex min-w-0 items-center gap-2"
const title = "text-sm font-medium text-muted-foreground truncate"
const badge = "shrink-0"
const content = "space-y-2 flex-1"
const statRow = "flex items-baseline gap-4"
const statGroup = "space-y-1"
const statValue = "text-lg font-bold"
const statLabel = "text-xs text-muted-foreground"
const footer = "mt-auto flex items-center gap-1.5 border-t pt-2 text-xs text-muted-foreground"
const footerValue = "font-medium text-foreground"
const cardShell = "relative flex h-full flex-col transition-colors hover:border-primary"
const unavailableIcon = "absolute right-2 top-2 h-4 w-4 text-destructive"
const skippedBadge = "shrink-0"
const skeletonBase =
  "animate-skeleton-shimmer rounded bg-[linear-gradient(90deg,var(--muted)_25%,color-mix(in_srgb,var(--muted)_40%,var(--background))_50%,var(--muted)_75%)] bg-[length:200%_100%]"
const skeletonWide = `${skeletonBase} h-7 w-16`
const skeletonNarrow = `${skeletonBase} h-7 w-10`
const skeletonTextWide = `${skeletonBase} h-3 w-16`
const skeletonTextNarrow = `${skeletonBase} h-3 w-10`
const clockIcon = "h-3 w-3"
const linkShell = "block h-full"
const diskGroup = "space-y-1"
const row = "flex items-center justify-between text-xs"
const rowLabel = "text-muted-foreground"
const rowValue = "font-medium tabular-nums"
const barTrack = "h-1.5 w-full overflow-hidden rounded-full bg-muted"
const diskBar = "h-full rounded-full bg-primary transition-all"
const skeletonBar = `w-full ${skeletonBase}`

export {
  header,
  title,
  badge,
  content,
  statRow,
  statGroup,
  statValue,
  statLabel,
  footer,
  footerValue,
  cardShell,
  unavailableIcon,
  skeletonWide,
  skeletonNarrow,
  skeletonTextWide,
  skeletonTextNarrow,
  clockIcon,
  linkShell,
  titleGroup,
  skippedBadge,
  diskGroup,
  row,
  rowLabel,
  rowValue,
  barTrack,
  diskBar,
  skeletonBar,
}
