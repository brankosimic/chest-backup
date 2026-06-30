"use client"

import { useEffect } from "react"
import { useSidebar } from "@/components/providers/SidebarProvider"

interface Props {
  children: React.ReactNode
}

const ClickOutside = ({ children }: Props) => {
  const { close } = useSidebar()

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      const target = event.target as HTMLElement

      if (!target.closest(".sidebar-overlay")) close()
    }

    document.addEventListener("click", handler)
    return () => document.removeEventListener("click", handler)
  }, [close])

  return children
}

export { ClickOutside }
