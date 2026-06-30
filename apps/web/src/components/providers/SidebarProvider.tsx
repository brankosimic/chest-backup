"use client"

import React, { useCallback, useContext, useState } from "react"
import type { NavPage } from "@/types"

interface SidebarContextValue {
  open: boolean
  toggle: () => void
  close: () => void
  currentPage: NavPage
  setCurrentPage: (page: NavPage) => void
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null)

const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState<NavPage>("dashboard")

  const toggle = useCallback(() => setOpen((prev) => !prev), [])
  const close = useCallback(() => setOpen(false), [])

  return (
    <SidebarContext.Provider value={{ open, toggle, close, currentPage, setCurrentPage }}>
      {children}
    </SidebarContext.Provider>
  )
}

const useSidebar = (): SidebarContextValue => {
  const context = useContext(SidebarContext)

  if (!context) throw new Error("useSidebar must be used within SidebarProvider")
  return context
}

export { SidebarProvider, useSidebar }
