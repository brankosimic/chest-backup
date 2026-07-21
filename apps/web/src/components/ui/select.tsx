import { cn } from "@/lib/utils"

const Select = ({
  value,
  onChange,
  children,
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void }) => {
  return (
    <select
      value={value}
      onChange={onChange}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}

export { Select }
