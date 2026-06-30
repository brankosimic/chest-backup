import { Menu, Package } from "lucide-react"
import { useTranslation } from "react-i18next"
import ThemeToggle from "./ThemeToggle"
import type { FC } from "react"

interface NavbarProps {
  theme: "light" | "dark"
  onToggleTheme: () => void
  onMenuClick: () => void
}

const Navbar: FC<NavbarProps> = ({ theme, onToggleTheme, onMenuClick }) => {
  const { t } = useTranslation()

  return (
    <header className="sticky top-0 z-30 glass border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left: Mobile menu + logo */}
        <div className="flex items-center gap-3 lg:gap-0">
          <button
            onClick={onMenuClick}
            className="p-2 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors lg:hidden cursor-pointer"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>

            <span className="text-sm font-semibold text-gray-900 dark:text-white">Chest Backup</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle theme={theme} toggle={onToggleTheme} />
        </div>
      </div>

      {/* Page title breadcrumb area */}
      <div className="px-4 lg:px-6 pb-3">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          {t("dashboard.title")}
        </h2>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t("dashboard.subtitle")}
        </p>
      </div>
    </header>
  )
}

export default Navbar
