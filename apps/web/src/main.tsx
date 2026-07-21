import React from "react"
import ReactDOM from "react-dom/client"
import { createBrowserRouter, RouterProvider } from "react-router-dom"
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
import NewDestinationPage from "@/app/(dashboard)/destinations/new/page"
import DestinationDetailPage from "@/app/(dashboard)/destinations/[id]/page"
import SchedulePage from "@/app/(dashboard)/schedule/page"
import RetentionPage from "@/app/(dashboard)/retention/page"
import NotificationsPage from "@/app/(dashboard)/notifications/page"
import HistoryPage from "@/app/(dashboard)/history/page"
import LogsPage from "@/app/(dashboard)/logs/page"
import SettingsPage from "@/app/(dashboard)/settings/page"

const router = createBrowserRouter([
  {
    path: "/",
    element: <DashboardLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "sources", element: <SourcesPage /> },
      { path: "sources/new", element: <NewSourcePage /> },
      { path: "sources/:id", element: <SourceDetailPage /> },
      { path: "destinations", element: <DestinationsPage /> },
      { path: "destinations/new", element: <NewDestinationPage /> },
      { path: "destinations/:id", element: <DestinationDetailPage /> },
      { path: "schedule", element: <SchedulePage /> },
      { path: "retention", element: <RetentionPage /> },
      { path: "notifications", element: <NotificationsPage /> },
      { path: "history", element: <HistoryPage /> },
      { path: "logs", element: <LogsPage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
])

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryProvider>
      <I18nProvider>
        <RouterProvider router={router} />
      </I18nProvider>
    </QueryProvider>
  </React.StrictMode>,
)
