const overlay = "absolute inset-0 cursor-default bg-black/40 backdrop-blur-[2px]"
const panel = "relative flex h-full w-full max-w-xl flex-col border-l bg-card shadow-2xl animate-in slide-in-from-right"
const header = "flex items-start justify-between gap-4 border-b p-5"
const headerText = "min-w-0"
const title = "truncate text-lg font-semibold"
const description = "mt-0.5 text-sm text-muted-foreground"
const close = "rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground cursor-pointer"
const body = "flex-1 overflow-y-auto"
const footer = "border-t bg-muted/30 p-4"

export { overlay, panel, header, headerText, title, description, close, body, footer }
