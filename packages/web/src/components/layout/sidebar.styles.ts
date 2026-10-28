const aside = "hidden h-full w-64 flex-col border-r border-sidebar-border bg-sidebar-background md:flex"
const brandBar = "flex h-16 shrink-0 items-center border-b border-sidebar-border px-4"
const brand = "flex items-center gap-2.5 text-base font-semibold text-sidebar-primary-foreground"
const brandIcon = "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sidebar-accent"
const nav = "flex-1 space-y-1 overflow-y-auto px-3 py-4"
const link = "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
const linkCollapsed = "justify-center px-0"
const linkActive = "bg-sidebar-accent text-sidebar-accent-foreground"
const linkIdle = "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
const activeBar = "absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary"
const linkIcon = "h-4 w-4 shrink-0"
const linkIconIdle = "transition-colors group-hover:text-sidebar-accent-foreground"
const footer = "shrink-0 space-y-3 border-t border-sidebar-border p-3"
const runButton = "flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
const runButtonCollapsed = "justify-center px-0"
const runButtonRunning = "animate-pulse"
const spinner = "h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"
const status = "flex items-center gap-2.5 px-1 text-xs text-sidebar-foreground"
const statusCollapsed = "justify-center"
const statusDotWrap = "relative flex h-2 w-2 shrink-0"
const statusDotPing = "absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60"
const statusDot = "relative inline-flex h-2 w-2 rounded-full bg-success"

export {
  aside,
  brandBar,
  brand,
  brandIcon,
  nav,
  link,
  linkCollapsed,
  linkActive,
  linkIdle,
  activeBar,
  linkIcon,
  linkIconIdle,
  footer,
  runButton,
  runButtonCollapsed,
  runButtonRunning,
  spinner,
  status,
  statusCollapsed,
  statusDotWrap,
  statusDotPing,
  statusDot,
}
