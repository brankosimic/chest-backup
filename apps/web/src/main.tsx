import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { QueryProvider } from "@/components/QueryProvider"
import { I18nProvider } from "@/components/I18nProvider"
import "@/app/globals.css"

// Dashboard layout
import DashboardLayout from "@/app/(dashboard)/layout"
import DashboardPage from "@/app/(dashboard)/dashboard/page"
import SourcesPage from "@/app/(dashboard)/sources/page"
import NewSourcePage from "@/app/(dashboard)/sources/new/page"
import SourceDetailPage from "@/app/(dashboard)/sources/[id]/page"
import DestinationsPage from "@/app/(dashboard)/destinations/page"
import DestinationDetailPage from "@/app/(dashboard)/destinations/[id]/page"
import SchedulePage from "@/app/(dashboard)/schedule/page"
import RetentionPage from "@/app/(dashboard)/retention/page"
import NotificationsPage from "@/app/(dashboard)/notifications/page"
import HistoryPage from "@/app/(dashboard)/history/page"
import LogsPage from "@/app/(dashboard)/logs/page"
import SettingsPage from "@/app/(dashboard)/settings/page"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryProvider>
        <I18nProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/sources" element={<SourcesPage />} />
              <Route path="/sources/new" element={<NewSourcePage />} />
              <Route path="/sources/:id" element={<SourceDetailPage />} />
              <Route path="/destinations" element={<DestinationsPage />} />
              <Route path="/destinations/:id" element={<DestinationDetailPage />} />
              <Route path="/schedule" element={<SchedulePage />} />
              <Route path="/retention" element={<RetentionPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/logs" element={<LogsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </I18nProvider>
      </QueryProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
