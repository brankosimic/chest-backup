import { cn } from "@/lib/utils"

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

const Select = ({ label, error, options, className, ...props }: SelectProps) => {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-slate-300">{label}</label>}
      <select
        {...props}
        className={cn(
          "w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors appearance-none",
          error && "border-rose-500 focus:border-rose-500 focus:ring-rose-500",
          className,
        )}
      >
        {options.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  )
}

export { Select }
