import { NavLink } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { LayoutDashboard, Clock, Database, HardDrive, FileText, Settings, X, Package } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { FC } from "react"
import type { NavItem } from "@/types/index"

const navItems: NavItem[] = [
  { labelKey: "nav.dashboard", path: "/", icon: "dashboard", page: "dashboard" },
  { labelKey: "nav.history", path: "/history", icon: "history", page: "history" },
  { labelKey: "nav.sources", path: "/sources", icon: "sources", page: "sources" },
  { labelKey: "nav.destinations", path: "/destinations", icon: "destinations", page: "destinations" },
  { labelKey: "nav.logs", path: "/logs", icon: "logs", page: "logs" },
  { labelKey: "nav.settings", path: "/settings", icon: "settings", page: "settings" },
]

const iconMap: Record<string, FC<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  history: Clock,
  sources: Database,
  destinations: HardDrive,
  logs: FileText,
  settings: Settings,
}

interface SidebarProps {
  open: boolean
  onClose: () => void
}

const Sidebar: FC<SidebarProps> = ({ open, onClose }) => {
  const { t } = useTranslation()

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-200 dark:border-gray-800">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md">
          <Package className="w-5 h-5 text-white" />
        </div>

        <div>
          <h1 className="text-base font-bold text-gray-900 dark:text-white">Chest Backup</h1>
          <p className="text-xs text-gray-400 dark:text-gray-500">Daemon UI</p>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = iconMap[item.icon]

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
                }`
              }
            >
              {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
              {t(item.labelKey)}
            </NavLink>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-800">
        <p className="text-xs text-gray-400 dark:text-gray-600">v1.0.0</p>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:fixed lg:inset-y-0 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
              onClick={onClose}
            />

            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 lg:hidden"
            >
              <div className="absolute top-3 right-3">
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default Sidebar
