"use client"

import { useTranslation } from "react-i18next"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/layout/header"
import { Plus } from "lucide-react"
import { useDestinations } from "@/hooks/use-queries"
import type { Destination } from "@chest-backup/shared"

export default function DestinationsPage() {
  const { t } = useTranslation()
  const { data: destinations, isLoading } = useDestinations()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl">
      <Header
        title={t("destinations.title")}
        subtitle={t("destinations.subtitle")}
        action={
          <Link href="/destinations/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("destinations.addDestination")}
            </Button>
          </Link>
        }
      />

      {!destinations?.length ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">{t("destinations.noDestinations")}</p>
            <p className="mt-2 text-center text-sm">{t("destinations.noDestinationsDesc")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.map((dest: Destination) => (
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
                        <p className="text-muted-foreground">{dest.host}:{dest.port}</p>
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
  )
}
