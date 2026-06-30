import { lazy, Suspense } from "react"
import { Routes, Route } from "react-router-dom"
import Layout from "@/components/Layout"
import LoadingSkeleton from "@/components/LoadingSkeleton"

const Dashboard = lazy(() => import("@/routes/Dashboard"))
const History = lazy(() => import("@/routes/History"))
const Sources = lazy(() => import("@/routes/Sources"))
const Destinations = lazy(() => import("@/routes/Destinations"))
const Logs = lazy(() => import("@/routes/Logs"))
const Settings = lazy(() => import("@/routes/Settings"))

const App = () => (
  <Layout>
    <Suspense fallback={<LoadingSkeleton />}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/history" element={<History />} />
        <Route path="/sources" element={<Sources />} />
        <Route path="/destinations" element={<Destinations />} />
        <Route path="/logs" element={<Logs />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  </Layout>
)

export default App
