import React from "react"
import ReactDOM from "react-dom/client"
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom"
import { QueryProvider } from "@/components/QueryProvider"
import { I18nProvider } from "@/components/I18nProvider"
import { ErrorBoundary } from "@/components/ui/error-boundary"
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
import ActivityPage from "@/app/(dashboard)/activity/page"
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
      { path: "activity", element: <ActivityPage /> },
      { path: "history", element: <Navigate to="/activity" replace /> },
      { path: "logs", element: <Navigate to="/activity" replace /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
])

const rootEl = document.getElementById("root")
if (rootEl)
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <ErrorBoundary>
        <QueryProvider>
          <I18nProvider>
            <RouterProvider router={router} />
          </I18nProvider>
        </QueryProvider>
      </ErrorBoundary>
    </React.StrictMode>,
  )
