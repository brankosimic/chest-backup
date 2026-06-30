const sidebar = "fixed left-0 top-0 z-40 h-full w-64 bg-slate-900/95 backdrop-blur-sm border-r border-slate-700/50 flex flex-col"
const sidebarHeader = "flex items-center gap-3 px-6 py-5 border-b border-slate-700/50"
const sidebarLogo = "h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center"
const sidebarTitle = "text-lg font-semibold text-white"
const navList = "flex-1 overflow-y-auto px-3 py-4 space-y-1"
const navItem = "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer"
const navItemInactive = "text-slate-400 hover:text-white hover:bg-slate-800/60"
const navItemActive = "text-white bg-indigo-600/20 hover:bg-indigo-600/30"
const navItemIcon = "h-5 w-5 shrink-0"
const overlay = "fixed inset-0 z-30 bg-black/50 backdrop-blur-sm sidebar-overlay"
const mobileOverlay = "fixed inset-0 z-30 bg-black/50 lg:hidden"

export {
  sidebar,
  sidebarHeader,
  sidebarLogo,
  sidebarTitle,
  navList,
  navItem,
  navItemInactive,
  navItemActive,
  navItemIcon,
  overlay,
  mobileOverlay,
}
