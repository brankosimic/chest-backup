type PageName = "dashboard" | "history" | "sources" | "destinations" | "logs" | "settings"

interface NavItem {
  labelKey: string
  path: string
  icon: string
  page: PageName
}

export type { PageName, NavItem }
