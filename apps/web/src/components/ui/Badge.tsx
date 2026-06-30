import { cn } from "@/lib/utils"

interface BadgeProps {
  children: React.ReactNode
  variant?: "success" | "warning" | "error" | "info" | "neutral"
  className?: string
}

const variantClasses = {
  success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  error: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  info: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  neutral: "bg-slate-500/10 text-slate-400 border-slate-500/20",
}

const Badge = ({ children, variant = "neutral", className }: BadgeProps) => {
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", variantClasses[variant], className)}>
      {children}
    </span>
  )
}

export { Badge }
