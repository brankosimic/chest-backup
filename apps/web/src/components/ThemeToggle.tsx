import { Sun, Moon } from "lucide-react"
import type { FC } from "react"

interface ThemeToggleProps {
  theme: "light" | "dark"
  toggle: () => void
}

const ThemeToggle: FC<ThemeToggleProps> = ({ theme, toggle }) => (
  <button
    onClick={toggle}
    className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 cursor-pointer"
    aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
  >
    <div className="relative w-5 h-5">
      <Sun
        className={`absolute inset-0 w-5 h-5 text-amber-500 transition-all duration-300 ${
          theme === "dark" ? "opacity-0 rotate-90 scale-0" : "opacity-100 rotate-0 scale-100"
        }`}
      />
      <Moon
        className={`absolute inset-0 w-5 h-5 text-indigo-400 transition-all duration-300 ${
          theme === "dark" ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0"
        }`}
      />
    </div>
  </button>
)

export default ThemeToggle
