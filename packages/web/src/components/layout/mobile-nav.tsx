"use client"

import { useTranslation } from "react-i18next"
import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Menu, X, Box } from "lucide-react"
import * as styles from "./mobile-nav.styles"

interface NavItem {
  href: string
  label: string
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "nav.dashboard" },
  { href: "/sources", label: "nav.sources" },
  { href: "/destinations", label: "nav.destinations" },
  { href: "/notifications", label: "nav.notifications" },
  { href: "/activity", label: "nav.activity" },
  { href: "/settings", label: "nav.settings" },
]

const MobileNav = () => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  return (
    <>
      <header className={styles.bar}>
        <button
          type="button"
          onClick={() => {
            setOpen((prev) => !prev)
          }}
          className={styles.toggle}
          aria-label={open ? t("common.close") : t("nav.menu")}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <Link to="/dashboard" className={styles.brand}>
          <Box className="h-5 w-5" />
          Chest-Backup
        </Link>
      </header>

      {open && (
        <div className={styles.overlay} onClick={() => { setOpen(false) }}>
          <nav className={styles.drawer} onClick={(e) => { e.stopPropagation() }}>
            <ul className="space-y-1">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      onClick={() => {
                        setOpen(false)
                      }}
                      className={cn(styles.item, isActive && styles.itemActive)}
                    >
                      {t(item.label)}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>
      )}
    </>
  )
}

export { MobileNav }
