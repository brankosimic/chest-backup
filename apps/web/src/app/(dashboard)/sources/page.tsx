import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Header } from "@/components/layout/header"
import { Plus, Folder, Database, Container, Boxes, Trash2 } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { useSources, useDeleteSource } from "@/hooks/use-queries"
import type { Source } from "@chest-backup/shared"

const sourceIcon = (type: string) => {
  switch (type) {
    case "path": return <Folder className="h-5 w-5 text-blue-500" />
    case "postgres": return <Database className="h-5 w-5 text-purple-500" />
    case "postgres-container": return <Container className="h-5 w-5 text-amber-500" />
    case "docker-compose": return <Boxes className="h-5 w-5 text-cyan-500" />
    default: return <Folder className="h-5 w-5 text-muted-foreground" />
  }
}

const sourceTypeLabelKey = (type: string): string => {
  switch (type) {
    case "path": return "sources.typePath"
    case "postgres": return "sources.typePostgres"
    case "postgres-container": return "sources.typePostgresContainer"
    case "docker-compose": return "sources.typeDockerCompose"
    default: return type
  }
}

const sourceTitle = (source: Source): string => {
  switch (source.type) {
    case "path": return source.path ?? ""
    case "postgres": return source.host ?? ""
    case "postgres-container": return source.containerName ?? source.host ?? ""
    case "docker-compose": return source.name ?? source.path ?? ""
    default: return ""
  }
}

export default function SourcesPage() {
  const { t } = useTranslation()
  const { data: sources, isLoading, isError, refetch } = useSources()
  const deleteSource = useDeleteSource()

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (window.confirm(t("common.confirmDelete")))
      deleteSource.mutate(id)
  }

  if (isLoading)
    return <LoadingSpinner className="h-screen" />

  if (isError)
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
        <Card>
          <CardContent className="flex flex-col items-center gap-4 pt-6">
            <p className="text-center text-muted-foreground">{t("common.error")}</p>
            <Button variant="outline" onClick={() => refetch()}>{t("common.refresh")}</Button>
          </CardContent>
        </Card>
      </div>
    )

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
            <Link key={source.id} to={`/sources/${source.id}`} className="group">
              <Card className="relative hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 min-w-0">
                      {sourceIcon(source.type)}
                      <div className="min-w-0">
                        <CardTitle className="text-base truncate">
                          {sourceTitle(source)}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {t(sourceTypeLabelKey(source.type))}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => handleDelete(source.id, e)}
                        className="rounded p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                        title={t("common.delete")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {source.type === "path" && (
                    <p className="text-sm text-muted-foreground font-mono truncate">{source.path}</p>
                  )}
                  {source.type === "postgres" && (
                    <div className="space-y-1 text-sm">
                      <p className="text-muted-foreground truncate">{source.host}:{source.port}</p>
                      <p className="text-muted-foreground truncate">{t("sources.database")}: {source.database}</p>
                    </div>
                  )}
                  {source.type === "postgres-container" && (
                    <div className="space-y-1 text-sm">
                      <p className="text-muted-foreground truncate">{t("sources.containerName")}: {source.containerName}</p>
                      <p className="text-muted-foreground truncate">{t("sources.database")}: {source.database}</p>
                    </div>
                  )}
                  {source.type === "docker-compose" && (
                    <div className="space-y-1 text-sm">
                      <p className="text-muted-foreground truncate">{t("sources.path")}: {source.path}</p>
                      {!!source.containers?.length && (
                        <p className="text-muted-foreground truncate">{t("sources.containers")}: {source.containers.join(", ")}</p>
                      )}
                    </div>
                  )}
                  {source.createdAt && (
                    <p className="mt-3 text-xs text-muted-foreground border-t pt-2">
                      {t("sources.createdAt")}: {formatDate(source.createdAt)}
                    </p>
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
