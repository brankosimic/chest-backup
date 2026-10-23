const page = "mx-auto max-w-[100rem]"
const headerActions = "flex items-center gap-2"
const tabsRow = "flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
const liveBadge = "inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 font-medium text-primary"
const liveDot = "h-2 w-2 animate-pulse rounded-full bg-primary"
const streamState = "inline-flex items-center gap-1.5"
const streamDotOnline = "h-2 w-2 rounded-full bg-success"
const streamDotOffline = "h-2 w-2 rounded-full bg-muted-foreground/50"
const cardContent = "space-y-4 p-3 sm:p-4"
const filterRow = "flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
const filterMeta = "flex items-center gap-2 text-xs text-muted-foreground"
const tableShell = "overflow-hidden rounded-lg border"
const pagination = "flex items-center justify-between gap-3"
const paginationLabel = "text-sm text-muted-foreground"
const logToolbar = "flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center"
const logSearch = "relative min-w-[12rem] sm:flex-1 sm:max-w-xs"
const logSearchIcon = "pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
const logLevel = "rounded-md border px-2 py-1 text-xs font-medium uppercase transition-colors cursor-pointer"
const logLevelActive = "border-primary bg-primary/10 text-primary"
const logLevelInactive = "border-input text-muted-foreground hover:text-foreground"
const logActions = "flex items-center gap-2 sm:ml-auto"
const logMeta = "flex items-center justify-between text-xs text-muted-foreground"
const logLiveNote = "ml-2 text-primary"
const logShell = "h-[calc(100vh-22rem)] min-h-[24rem] overflow-hidden rounded-lg border bg-muted/20"

export {
  page,
  headerActions,
  tabsRow,
  liveBadge,
  liveDot,
  streamState,
  streamDotOnline,
  streamDotOffline,
  cardContent,
  filterRow,
  filterMeta,
  tableShell,
  pagination,
  paginationLabel,
  logToolbar,
  logSearch,
  logSearchIcon,
  logLevel,
  logLevelActive,
  logLevelInactive,
  logActions,
  logMeta,
  logLiveNote,
  logShell,
}
