import { cn } from "@/lib/utils"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "destructive" | "ghost"
  size?: "sm" | "md" | "lg"
  loading?: boolean
}

const variantClasses = {
  primary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-500/20",
  secondary: "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700",
  destructive: "bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-500/20",
  ghost: "hover:bg-slate-800/60 text-slate-400 hover:text-white",
}

const sizeClasses = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
}

const Button = ({ variant = "primary", size = "md", loading = false, className, children, disabled, ...props }: ButtonProps) => {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
}

export { Button }
