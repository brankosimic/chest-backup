"use client"

import { useTranslation } from "react-i18next"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface NavItem {
  href: string
  label: string
  badge?: string
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "nav.dashboard" },
  { href: "/sources", label: "nav.sources" },
  { href: "/destinations", label: "nav.destinations" },
  { href: "/schedule", label: "nav.schedule" },
  { href: "/retention", label: "nav.retention" },
  { href: "/notifications", label: "nav.notifications" },
  { href: "/history", label: "nav.history" },
  { href: "/logs", label: "nav.logs" },
  { href: "/settings", label: "nav.settings" },
]

const Sidebar = ({ collapsed = false }: { collapsed?: boolean }) => {
  const { t } = useTranslation()
  const pathname = usePathname()

  return (
    <aside className={cn("flex h-full w-64 flex-col border-r bg-sidebar-background", collapsed && "w-16")}>
      <div className="flex h-16 items-center border-b border-sidebar-border px-4">
        <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold text-sidebar-primary-foreground">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
          {!collapsed && <span>Chest-Backup</span>}
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive ? "bg-sidebar-accent text-sidebar-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary-foreground",
              )}
            >
              <span className="flex-1">{!collapsed && t(item.label)}</span>
              {item.badge && <Badge variant="secondary">{item.badge}</Badge>}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-2 text-xs text-sidebar-foreground">
          <div className="h-2 w-2 rounded-full bg-success" />
          {!collapsed && <span>Daemon Running</span>}
        </div>
      </div>
    </aside>
  )
}

export { Sidebar }
