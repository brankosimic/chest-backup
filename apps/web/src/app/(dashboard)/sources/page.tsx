import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Header } from "@/components/layout/header"
import { Plus, Folder, FolderOpen, Database, Container, Boxes, Trash2, ChevronRight } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { useSources, useDeleteSource } from "@/hooks/use-queries"
import type { Source } from "@chest-backup/shared"

const sourceIcon = (type: string) => {
  switch (type) {
    case "path": return <Folder className="h-5 w-5 text-blue-500 shrink-0" />
    case "postgres": return <Database className="h-5 w-5 text-purple-500 shrink-0" />
    case "postgres-container": return <Container className="h-5 w-5 text-amber-500 shrink-0" />
    case "docker-compose": return <Boxes className="h-5 w-5 text-cyan-500 shrink-0" />
    default: return <Folder className="h-5 w-5 text-muted-foreground shrink-0" />
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

const TYPE_ORDER = ["path", "postgres", "postgres-container", "docker-compose"] as const

const getParentDir = (p: string): string => {
  const i = p.lastIndexOf("/")
  return i > 0 ? p.slice(0, i) : i === 0 ? "/" : ""
}

const getBaseName = (p: string): string => {
  const i = p.lastIndexOf("/")
  return i >= 0 ? p.slice(i + 1) : p
}

const groupByParent = (items: Source[]): Map<string, Source[]> =>
  items.reduce((map, s) => {
    const parent = getParentDir(s.path ?? "")
    if (!map.has(parent)) map.set(parent, [])
    map.get(parent)!.push(s)
    return map
  }, new Map<string, Source[]>())

interface SourceDetailsProps {
  source: Source
}

const SourceDetails = ({ source }: SourceDetailsProps) => {
  const { t } = useTranslation()
  switch (source.type) {
    case "path":
      return null
    case "postgres":
      return (
        <p className="text-sm text-muted-foreground">
          Port {source.port} &middot; {t("sources.database")}: {source.database}
        </p>
      )
    case "postgres-container":
      return (
        <p className="text-sm text-muted-foreground">
          {t("sources.database")}: {source.database}
        </p>
      )
    case "docker-compose": {
      const showExtraPath = source.name && source.path
      return (
        <p className="text-sm text-muted-foreground break-words">
          {showExtraPath && <>{t("sources.path")}: {source.path}</>}
          {!!source.containers?.length && (
            showExtraPath ? <> &middot; {source.containers.join(", ")}</> : source.containers.join(", ")
          )}
        </p>
      )
    }
    default:
      return null
  }
}

const sourceRow = (source: Source, handleDelete: (id: string, e: React.MouseEvent) => void, t: (key: string) => string, titleOverride?: string) => (
  <Link key={source.id} to={`/sources/${source.id}`}
    className="group flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/50"
  >
    <div className="min-w-0 flex-1">
      <p className="font-medium break-words">{titleOverride ?? sourceTitle(source)}</p>
      {!titleOverride && <SourceDetails source={source} />}
    </div>
    <div className="flex shrink-0 items-center gap-2">
      <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(source.createdAt)}</span>
      <button onClick={(e) => handleDelete(source.id, e)}
        className="rounded p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
        title={t("common.delete")}
      >
        <Trash2 className="h-4 w-4" />
      </button>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </div>
  </Link>
)

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

  const grouped = TYPE_ORDER
    .map((type) => ({
      type,
      label: sourceTypeLabelKey(type),
      icon: sourceIcon(type),
      items: sources?.filter((s) => s.type === type) ?? [],
    }))
    .filter((g) => g.items.length > 0)

  return (
    <div className="mx-auto max-w-5xl">
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

      {!grouped.length ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">{t("sources.noSources")}</p>
            <p className="mt-2 text-center text-sm">{t("sources.noSourcesDesc")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {grouped.map((group) => (
            <section key={group.type}>
              <div className="mb-3 flex items-center gap-2 border-b pb-2">
                {group.icon}
                <h2 className="text-lg font-semibold">{t(group.label)}</h2>
                <span className="text-sm text-muted-foreground">({group.items.length})</span>
              </div>

              {group.type === "path" ? (
                <div className="space-y-3">
                  {Array.from(groupByParent(group.items).entries()).map(([parent, items]) => (
                    <div key={parent} className="rounded-lg border">
                      <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-1.5 text-xs font-semibold text-muted-foreground">
                        <FolderOpen className="h-3.5 w-3.5" />
                        {parent}/
                      </div>
                      {items.map((source) => sourceRow(source, handleDelete, t, getBaseName(source.path ?? "")))}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="divide-y rounded-lg border">
                  {group.items.map((source) => sourceRow(source, handleDelete, t))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
