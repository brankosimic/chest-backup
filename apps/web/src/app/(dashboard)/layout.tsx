"use client"

import { I18nProvider } from "@/components/I18nProvider"

export default function DashboardLayout(props: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      {props.children}
    </I18nProvider>
  )
}
