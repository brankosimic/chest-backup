import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/layout/header"
import { Plus } from "lucide-react"
import { useSources } from "@/hooks/use-queries"
import type { Source } from "@chest-backup/shared"

const typeBadgeVariant = (type: string): "default" | "secondary" | "outline" | "warning" => {
  switch (type) {
    case "path": return "default"
    case "postgres": return "secondary"
    case "postgres-container": return "outline"
    case "docker-compose": return "warning"
    default: return "default"
  }
}

export default function SourcesPage() {
  const { t } = useTranslation()
  const { data: sources, isLoading } = useSources()

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
        title={t("sources.title")}
        subtitle={t("sources.subtitle")}
        action={
          <Link to="/sources/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("sources.addSource")}
            </Button>
          </Link>
        }
      />

      {!sources?.length ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">{t("sources.noSources")}</p>
            <p className="mt-2 text-center text-sm">{t("sources.noSourcesDesc")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sources.map((source: Source) => (
            <Link key={source.id} to={`/sources/${source.id}`}>
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {source.type === "path" ? source.path : source.name ?? source.containerName ?? source.host}
                    </CardTitle>
                    <Badge variant={typeBadgeVariant(source.type)}>{source.type}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {source.type === "path" && <p className="text-sm text-muted-foreground font-mono">{source.path}</p>}
                  {source.type === "postgres" && (
                    <div className="space-y-1 text-sm">
                      <p className="text-muted-foreground">{source.host}:{source.port}</p>
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
  )
}
