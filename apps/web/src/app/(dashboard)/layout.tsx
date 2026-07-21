import { Outlet } from "react-router-dom"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"

const DashboardLayout = () => (
  <div className="flex min-h-screen">
    <Sidebar />
    <MobileNav />
    <main className="flex-1 overflow-auto">
      <div className="p-6 pt-20 md:pt-6">
        <Outlet />
      </div>
    </main>
  </div>
)

export default DashboardLayout
