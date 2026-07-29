import { cn } from "@/lib/utils"

const Tooltip = ({ children, content }: { children: React.ReactNode; content: string }) => {
  return (
    <div className="relative inline-block">
      {children}
      <div
        className={cn(
          "absolute left-1/2 z-50 hidden -translate-x-1/2 -translate-y-full cursor-default rounded bg-foreground px-2 py-1 text-xs text-background shadow-md transition-opacity group-hover:opacity-100",
          "bottom-full mb-2",
        )}
      >
        {content}
      </div>
    </div>
  )
}

export { Tooltip }
