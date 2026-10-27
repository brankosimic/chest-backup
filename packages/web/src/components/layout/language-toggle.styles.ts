const wrapper = "relative"
const trigger =
  "flex h-10 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer"
const globe = "h-4 w-4 shrink-0 text-muted-foreground"
const label = "hidden sm:inline"
const code = "sm:hidden"
const chevron = "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200"
const chevronOpen = "rotate-180"
const menu = "absolute right-0 z-50 mt-1 min-w-44 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
const option =
  "flex w-full items-center justify-between gap-3 rounded-sm px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground focus-visible:outline-none cursor-pointer"
const optionActive = "font-semibold"
const check = "h-4 w-4 shrink-0 text-primary"
const checkHidden = "opacity-0"

export { wrapper, trigger, globe, label, code, chevron, chevronOpen, menu, option, optionActive, check, checkHidden }
