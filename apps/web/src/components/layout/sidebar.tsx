import { useTranslation } from "react-i18next"
import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  LayoutDashboard,
  Database,
  HardDrive,
  Bell,
  History,
  FileText,
  Settings,
  Box,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  badge?: string
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "nav.dashboard", icon: LayoutDashboard },
  { href: "/sources", label: "nav.sources", icon: Database },
  { href: "/destinations", label: "nav.destinations", icon: HardDrive },
  { href: "/notifications", label: "nav.notifications", icon: Bell },
  { href: "/history", label: "nav.history", icon: History },
  { href: "/logs", label: "nav.logs", icon: FileText },
  { href: "/settings", label: "nav.settings", icon: Settings },
]

const Sidebar = ({ collapsed = false }: { collapsed?: boolean }) => {
  const { t } = useTranslation()
  const { pathname } = useLocation()

  return (
    <aside className={cn("hidden md:flex h-full w-64 flex-col border-r bg-sidebar-background", collapsed && "w-16")}>
      <div className="flex h-16 items-center border-b border-sidebar-border px-4">
        <Link to="/dashboard" className="flex items-center gap-2 text-lg font-semibold text-sidebar-primary-foreground">
          <Box className="h-6 w-6" />
          {!collapsed && <span>Chest-Backup</span>}
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive ? "bg-sidebar-accent text-sidebar-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-primary-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="flex-1">{t(item.label)}</span>}
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
