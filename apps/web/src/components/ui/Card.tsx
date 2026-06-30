import { cn } from "@/lib/utils"

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

const Card = ({ children, className, hover = false }: CardProps) => {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm p-6",
        hover && "hover:border-slate-700 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/5",
        className,
      )}
    >
      {children}
    </div>
  )
}

export { Card }
