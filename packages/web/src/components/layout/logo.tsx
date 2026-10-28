import { cn } from "@/lib/utils"

const Logo = ({ className }: { className?: string }) => (
  <img src="/logo.webp" alt="" aria-hidden="true" className={cn("h-5 w-5 rounded", className)} />
)

export { Logo }
