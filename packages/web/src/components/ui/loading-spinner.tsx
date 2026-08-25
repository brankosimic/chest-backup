import { cn } from "@/lib/utils"

const dims: Record<string, string> = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
}

const LoadingSpinner = ({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) => {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className={cn("animate-spin rounded-full border-2 border-primary border-t-transparent", dims[size])} />
    </div>
  )
}

export { LoadingSpinner }
