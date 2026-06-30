"use client"

import { useTranslation } from "react-i18next"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"


interface NavItem {
  href: string
  label: string
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "nav.dashboard" },
  { href: "/sources", label: "nav.sources" },
  { href: "/destinations", label: "nav.destinations" },
  { href: "/schedule", label: "nav.schedule" },
  { href: "/history", label: "nav.history" },
  { href: "/logs", label: "nav.logs" },
]

const MobileNav = () => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      <button onClick={() => setOpen((prev) => !prev)} className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-md border bg-background md:hidden" aria-label="Toggle menu">
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {open ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M3 12h18M3 6h18M3 18h18" />}
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden" onClick={() => { setOpen(false) }}>
          <div className="fixed inset-y-0 left-0 w-64 border-r bg-background p-4 shadow-xl" onClick={(e) => { e.stopPropagation() }}>
            <div className="mb-6 flex items-center gap-2 text-lg font-semibold">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              </svg>
              Chest-Backup
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
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
