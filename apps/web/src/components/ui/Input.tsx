import { cn } from "@/lib/utils"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = ({ label, error, className, ...props }: InputProps) => {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-slate-300">{label}</label>}
      <input
        {...props}
        className={cn(
          "w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
          error && "border-rose-500 focus:border-rose-500 focus:ring-rose-500",
          className,
        )}
      />
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  )
}

export { Input }
