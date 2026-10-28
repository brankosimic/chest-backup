import { LayoutDashboard, Database, HardDrive, Activity, Settings } from "lucide-react"
import type { NavItem } from "@/types/ui"

const navItems: NavItem[] = [
  { href: "/dashboard", label: "nav.dashboard", icon: LayoutDashboard },
  { href: "/sources", label: "nav.sources", icon: Database },
  { href: "/destinations", label: "nav.destinations", icon: HardDrive },
  { href: "/activity", label: "nav.activity", icon: Activity },
  { href: "/settings", label: "nav.settings", icon: Settings },
]

export { navItems }
