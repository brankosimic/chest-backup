"use client"

import { useTranslation } from "react-i18next"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { Header } from "@/components/layout/header"


interface Source {
  id: string
  type: string
  path?: string
  host?: string
  port?: number
  user?: string
  database?: string
  containerName?: string
  name?: string
  containers?: string[]
}

export default function SourcesPage() {
  const { t } = useTranslation()
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/sources`)
      .then((res) => res.json())
      .then((data: { data: Source[] }) => {
        setSources(data.data)
        setLoading(false)
      })
      .catch(() => {
        setSources([])
        setLoading(false)
      })
  }, [])

  const typeBadgeVariant = (type: string): "default" | "secondary" | "outline" | "warning" => {
    switch (type) {
      case "path":
        return "default"
      case "postgres":
        return "secondary"
      case "postgres-container":
        return "outline"
      case "docker-compose":
        return "warning"
      default:
        return "default"
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <MobileNav />

      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl p-6 pt-20 md:pt-6">
          <Header
            title={t("sources.title")}
            subtitle={t("sources.subtitle")}
            action={
              <Link href="/sources/new">
                <Button>
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  {t("sources.addSource")}
                </Button>
              </Link>
            }
          />

          {sources.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">{t("sources.noSources")}</p>
                <p className="mt-2 text-center text-sm">{t("sources.noSourcesDesc")}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sources.map((source) => (
                <Link key={source.id} href={`/sources/${source.id}`}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{source.type === "path" ? source.path : source.name ?? source.containerName ?? source.host}</CardTitle>
                        <Badge variant={typeBadgeVariant(source.type)}>{source.type}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {source.type === "path" && <p className="text-sm text-muted-foreground font-mono">{source.path}</p>}
                      {source.type === "postgres" && (
                        <div className="space-y-1 text-sm">
                          <p className="text-muted-foreground">
                            {source.host}:{source.port}
                          </p>
                          <p className="text-muted-foreground">Database: {source.database}</p>
                        </div>
                      )}
                      {source.type === "postgres-container" && (
                        <div className="space-y-1 text-sm">
                          <p className="text-muted-foreground">Container: {source.containerName}</p>
                          <p className="text-muted-foreground">Database: {source.database}</p>
                        </div>
                      )}
                      {source.type === "docker-compose" && (
                        <div className="space-y-1 text-sm">
                          <p className="text-muted-foreground">Path: {source.path}</p>
                          <p className="text-muted-foreground">Containers: {source.containers?.join(", ")}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
