"use client"

import { useTranslation } from "react-i18next"
import { MenuIcon } from "lucide-react"
import { useSidebar } from "@/components/providers/SidebarProvider"

interface Props {
  title: string
}

const Header = ({ title }: Props) => {
  const { t } = useTranslation()
  const { toggle } = useSidebar()

  return (
    <header className="sticky top-0 z-20 flex items-center gap-4 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50 px-4 py-3 lg:px-8">
      <button
        onClick={toggle}
        className="flex items-center justify-center h-10 w-10 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors lg:hidden"
      >
        <MenuIcon className="h-5 w-5" />
      </button>
      <h1 className="text-lg font-semibold text-white">{t(title)}</h1>
    </header>
  )
}

export { Header }
