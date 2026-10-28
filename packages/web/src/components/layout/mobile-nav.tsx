"use client"

import { useTranslation } from "react-i18next"
import { useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Menu, X, Play } from "lucide-react"
import { Logo } from "./logo"
import { useBackupProgress, useDestinations, useSystem, useTriggerBackup } from "@/hooks/use-queries"
import { isActiveRunPhase } from "@/lib/run-phase"
import { formatUptime } from "@/lib/utils"
import { navItems } from "./nav-items"
import * as styles from "./mobile-nav.styles"

const onKeydown = (setOpen: React.Dispatch<React.SetStateAction<boolean>>) => (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    setOpen(false)
  }
}

const MobileNav = () => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const { data: destinations } = useDestinations()
  const { data: progress } = useBackupProgress()
  const { data: system } = useSystem()
  const triggerMutation = useTriggerBackup(destinations ?? [])
  const isRunning = !!progress && isActiveRunPhase(progress.phase)

  useEffect(() => {
    if (!open) return
    document.addEventListener("keydown", onKeydown(setOpen))
    return () => {
      document.removeEventListener("keydown", onKeydown(setOpen))
    }
  }, [open])

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
          <Logo className="h-7 w-7" />
          Chest-Backup
        </Link>
      </header>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 top-14 z-30 md:hidden">
            <motion.button
              type="button"
              aria-label={t("common.close")}
              className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => {
                setOpen(false)
              }}
            />
            <motion.nav
              className={styles.drawer}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            >
              <ul className={styles.nav}>

                {navItems.map((item) => {
                  const Icon = item.icon
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
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{t(item.label)}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
              <div className={styles.footer}>
                <button
                  type="button"
                  onClick={() => {
                    triggerMutation.mutate()
                  }}
                  disabled={triggerMutation.isPending || isRunning}
                  className={styles.runButton}
                >
                  {isRunning ? (
                    <span className={styles.spinner} />
                  ) : (
                    <Play className="h-3.5 w-3.5" />
                  )}
                  <span>{isRunning ? t("dashboard.backupInProgress") : t("dashboard.runBackup")}</span>
                </button>
                {system && (
                  <div className={styles.status}>
                    <div className={styles.statusDotWrap}>
                      <span className={styles.statusDotPing} />
                      <span className={styles.statusDot} />
                    </div>
                    <span>{formatUptime(system.uptime)} · v{system.version}</span>
                  </div>
                )}
              </div>
            </motion.nav>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

export { MobileNav }
