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

interface Destination {
  id: string
  type: string
  path: string
  host?: string
  port?: number
  user?: string
  privateKey?: string
  retention?: number
  parallel?: boolean
  skip?: boolean
}

export default function DestinationsPage() {
  const { t } = useTranslation()
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/destinations`)
      .then((res) => res.json())
      .then((data) => {
        setDestinations(data.data)
        setLoading(false)
      })
      .catch(() => {
        setDestinations([])
        setLoading(false)
      })
  }, [])

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
            title={t("destinations.title")}
            subtitle={t("destinations.subtitle")}
            action={
              <Link href="/destinations/new">
                <Button>
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  {t("destinations.addDestination")}
                </Button>
              </Link>
            }
          />

          {destinations.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">{t("destinations.noDestinations")}</p>
                <p className="mt-2 text-center text-sm">{t("destinations.noDestinationsDesc")}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {destinations.map((dest) => (
                <Link key={dest.id} href={`/destinations/${dest.id}`}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-mono">{dest.path}</CardTitle>
                        <Badge variant={dest.type === "local" ? "default" : "secondary"}>{dest.type}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1 text-sm">
                        {dest.type === "sftp" && dest.host && (
                          <>
                            <p className="text-muted-foreground">
                              {dest.host}:{dest.port}
                            </p>
                            <p className="text-muted-foreground">User: {dest.user}</p>
                          </>
                        )}
                        <p className="text-muted-foreground">Retention: {dest.retention ?? "-"} days</p>
                        {dest.parallel !== undefined && <p className="text-muted-foreground">Parallel: {dest.parallel ? "Yes" : "No"}</p>}
                        {dest.skip && <Badge variant="outline">Skipped</Badge>}
                      </div>
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
