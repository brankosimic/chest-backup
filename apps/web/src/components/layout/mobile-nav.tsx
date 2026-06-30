import { useTranslation } from "react-i18next"
import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Menu, X, Box } from "lucide-react"

interface NavItem {
  href: string
  label: string
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

const MobileNav = () => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  return (
    <>
      <button
        onClick={() => { setOpen((prev) => !prev); }}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-md border bg-background md:hidden"
        aria-label="Toggle menu"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden" onClick={() => { setOpen(false) }}>
          <div className="fixed inset-y-0 left-0 w-64 border-r bg-background p-4 shadow-xl" onClick={(e) => { e.stopPropagation() }}>
            <div className="mb-6 flex items-center gap-2 text-lg font-semibold">
              <Box className="h-6 w-6" />
              Chest-Backup
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => { setOpen(false) }}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted",
                    )}
                  >
                    {t(item.label)}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  )
}

export { MobileNav }
