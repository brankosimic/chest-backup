import { Outlet } from "react-router-dom"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"

const DashboardLayout = () => (
  <div className="flex min-h-screen flex-col md:flex-row">
    <MobileNav />
    <Sidebar />
    <main className="min-w-0 flex-1 overflow-auto">
      <div className="p-4 md:p-6">
        <Outlet />
      </div>
    </main>
  </div>
)

export default DashboardLayout
