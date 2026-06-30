"use client"

import { I18nProvider } from "@/components/I18nProvider"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"

export default function DashboardLayout(props: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <MobileNav />
        <main className="flex-1 overflow-auto">
          <div className="p-6 pt-20 md:pt-6">
            {props.children}
          </div>
        </main>
      </div>
    </I18nProvider>
  )
}
