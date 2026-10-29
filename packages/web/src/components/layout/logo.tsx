import { cn } from "@/lib/utils"
import type { LogoProps } from "@/types/ui"

const Logo = ({ className }: LogoProps) => (
  <img src="/logo.webp" alt="" aria-hidden="true" className={cn("h-5 w-5 rounded", className)} />
)

export { Logo }
