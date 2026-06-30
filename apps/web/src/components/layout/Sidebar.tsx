"use client"

import { useTranslation } from "react-i18next"
import { AnimatePresence, motion } from "framer-motion"
import {
  BarChart3Icon,
  BellIcon,
  ClockIcon,
  DatabaseIcon,
  HistoryIcon,
  ServerIcon,
  SettingsIcon,
} from "lucide-react"
import { useSidebar } from "@/components/providers/SidebarProvider"
import * as styles from "./Sidebar.styles"
import type { NavPage } from "@/types"

const navItems: { page: NavPage; icon: React.ComponentType<{ className?: string }> }[] = [
  { page: "dashboard", icon: BarChart3Icon },
  { page: "sources", icon: DatabaseIcon },
  { page: "destinations", icon: ServerIcon },
  { page: "schedule", icon: ClockIcon },
  { page: "notifications", icon: BellIcon },
  { page: "history", icon: HistoryIcon },
  { page: "settings", icon: SettingsIcon },
]

const Sidebar = () => {
  const { t } = useTranslation()
  const { open, close, currentPage, setCurrentPage } = useSidebar()

  const handleNavClick = (page: NavPage) => {
    setCurrentPage(page)
    close()
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.mobileOverlay}
            onClick={close}
          />
        )}
      </AnimatePresence>
      <motion.nav
        initial={{ x: -280 }}
        animate={{ x: open ? 0 : -280 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={styles.sidebar}
      >
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarLogo}>
            <DatabaseIcon className="h-5 w-5 text-white" />
          </div>
          <span className={styles.sidebarTitle}>Chest Backup</span>
        </div>
        <ul className={styles.navList}>
          {navItems.map(({ page, icon: Icon }) => (
            <li key={page}>
              <button
                onClick={() => handleNavClick(page)}
                className={`${styles.navItem} ${currentPage === page ? styles.navItemActive : styles.navItemInactive}`}
              >
                <Icon className={styles.navItemIcon} />
                {t(`nav.${page}`)}
              </button>
            </li>
          ))}
        </ul>
      </motion.nav>
    </>
  )
}

export { Sidebar }
