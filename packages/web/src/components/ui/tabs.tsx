import { createContext, useContext, useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import type { TabsContentProps, TabsProps, TabsTriggerProps } from "@/types/ui"
import * as styles from "./tabs.styles"

interface TabsContextValue {
  value: string
  setValue: (value: string) => void
}

const TabsContext = createContext<TabsContextValue | null>(null)

const Tabs = ({ value, defaultValue = "", onValueChange, className, children, ...props }: TabsProps) => {
  const [internal, setInternal] = useState(defaultValue)
  const current = value ?? internal

  const context = useMemo<TabsContextValue>(
    () => ({
      value: current,
      setValue: (next: string) => {
        if (value === undefined) setInternal(next)
        onValueChange?.(next)
      },
    }),
    [current, value, onValueChange],
  )

  return (
    <TabsContext.Provider value={context}>
      <div className={cn("flex flex-col", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

const useTabs = (): TabsContextValue => {
  const context = useContext(TabsContext)
  if (!context) throw new Error("Tabs components must be used within <Tabs>")
  return context
}

const TabsList = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn(styles.list, className)} {...props} />
)

const TabsTrigger = ({ value, className, ...props }: TabsTriggerProps) => {
  const tabs = useTabs()
  const active = tabs.value === value

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={() => {
        tabs.setValue(value)
      }}
      className={cn(styles.trigger, active ? styles.triggerActive : styles.triggerInactive, className)}
      {...props}
    />
  )
}

const TabsContent = ({ value, className, ...props }: TabsContentProps) => {
  const tabs = useTabs()
  if (tabs.value !== value) return null

  return <div role="tabpanel" className={cn(styles.content, className)} {...props} />
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
