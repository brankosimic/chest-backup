"use client"

import { useTranslation } from "react-i18next"
import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Tooltip } from "@/components/ui/tooltip"
import { Play } from "lucide-react"
import { Logo } from "./logo"
import { useBackupProgress, useDestinations, useSystem, useTriggerBackup } from "@/hooks/use-queries"
import { isActiveRunPhase } from "@/lib/run-phase"
import { formatUptime } from "@/lib/utils"
import { navItems } from "./nav-items"
import * as styles from "./sidebar.styles"

const Sidebar = ({ collapsed = false }: { collapsed?: boolean }) => {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const { data: destinations } = useDestinations()
  const { data: progress } = useBackupProgress()
  const { data: system } = useSystem()
  const triggerMutation = useTriggerBackup(destinations ?? [])
  const isRunning = !!progress && isActiveRunPhase(progress.phase)

  return (
    <aside className={styles.aside}>
      <div className={styles.brandBar}>
        <Link to="/dashboard" className={styles.brand}>
          <span className={styles.brandIcon}>
            <Logo className="h-7 w-7" />
          </span>
          {!collapsed && <span>Chest Backup</span>}
        </Link>
      </div>

      <nav className={styles.nav}>

        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
          const link = (
            <Link
              to={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                styles.link,
                collapsed && styles.linkCollapsed,
                isActive ? styles.linkActive : styles.linkIdle,
              )}
            >
              {isActive && <span className={styles.activeBar} />}
              <Icon className={cn(styles.linkIcon, !isActive && styles.linkIconIdle)} />
              {!collapsed && <span className="flex-1">{t(item.label)}</span>}
            </Link>
          )

          return collapsed ? (
            <Tooltip key={item.href} content={t(item.label)} side="top">
              {link}
            </Tooltip>
          ) : (
            <div key={item.href}>{link}</div>
          )
        })}
      </nav>

      <div className={styles.footer}>
        <button
          type="button"
          onClick={() => {
            triggerMutation.mutate()
          }}
          disabled={triggerMutation.isPending || isRunning}
          title={isRunning ? t("dashboard.backupInProgress") : t("dashboard.runBackup")}
          className={cn(styles.runButton, collapsed && styles.runButtonCollapsed, isRunning && styles.runButtonRunning)}
        >
          {isRunning ? (
            <span className={styles.spinner} />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
          {!collapsed && (
            <span>{isRunning ? t("dashboard.backupInProgress") : t("dashboard.runBackup")}</span>
          )}
        </button>

        {system && (
          <div className={cn(styles.status, collapsed && styles.statusCollapsed)}>
            <div className={styles.statusDotWrap}>
              <span className={styles.statusDotPing} />
              <span className={styles.statusDot} />
            </div>
            {!collapsed && (
              <span>
                {formatUptime(system.uptime)} · v{system.version}
              </span>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}

export { Sidebar }
