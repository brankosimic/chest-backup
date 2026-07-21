import { useState, createContext, useContext } from "react"
import type { MouseEvent } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Header } from "@/components/layout/header"
import { Plus, Folder, FolderOpen, File, Database, Container, Trash2, ChevronRight } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { useSources, useDeleteSource } from "@/hooks/use-queries"
import type { Source } from "@chest-backup/shared"
import type {
  TreeContextValue,
  TreeNode,
  TreeNodeRowProps,
  SourceRowProps,
  SourceSection,
} from "@/types/sources"
import { sourceIcon, sourceTypeLabelKey, buildPathTree } from "@/lib/sources"

const TreeContext = createContext<TreeContextValue | null>(null)

const useTree = () => {
  const ctx = useContext(TreeContext)
  if (!ctx) throw new Error("useTree must be used within TreeContext.Provider")
  return ctx
}

const TYPE_ORDER = ["path", "postgres", "postgres-container", "container-volume", "sqlite", "sqlite-container"] as const

const TreeNodeRow = ({ node, depth }: TreeNodeRowProps) => {
  const ctx = useTree()
  const hasChildren = !!node.children?.length
  const isExpanded = ctx.expanded.has(node.id)

  const handleClick = () => {
    if (hasChildren)
      ctx.onToggle(node.id)
    else if (node.source)
      ctx.onNavigate(`/sources/${node.source.id}`)
  }

  return (
    <>
      <div
        className="group flex cursor-pointer items-center gap-2 px-4 py-2 hover:bg-muted/50"
        style={{ paddingLeft: depth * 20 + 12 }}
        onClick={handleClick}
      >
        <span className="flex w-4 shrink-0 items-center justify-center">
          {hasChildren ? (
            <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
          ) : (
            <span className="flex h-4 w-4 shrink-0 items-center justify-center text-muted-foreground">&ndash;</span>
          )}
        </span>
        {node.icon}
        <span className="min-w-0 flex-1 break-words font-medium">{node.label}</span>
        {node.children && (
          <span className="text-xs text-muted-foreground">{node.children.length}</span>
        )}
        {node.source && (
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-xs text-muted-foreground">{formatDate(node.source.createdAt)}</span>
            <button
              onClick={(e) => { e.stopPropagation(); ctx.onDelete(node.source!.id, e); }}
              className="rounded p-1 text-muted-foreground opacity-0 transition-all hover:text-destructive group-hover:opacity-100"
              title={ctx.t("common.delete")}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
      {hasChildren && isExpanded && node.children!.map((child) => (
        <TreeNodeRow key={child.id} node={child} depth={depth + 1} />
      ))}
    </>
  )
}

const SourceRow = ({ source }: SourceRowProps) => {
  const ctx = useTree()
  const detailLines = sourceDetailLines(source, ctx.t)

  return (
    <div
      className="group flex cursor-pointer items-center gap-2 px-4 py-2 hover:bg-muted/50"
      onClick={() => ctx.onNavigate(`/sources/${source.id}`)}
    >
      <span className="flex w-4 shrink-0 items-center justify-center">
        <span className="flex h-4 w-4 shrink-0 items-center justify-center text-muted-foreground">&ndash;</span>
      </span>
      {sourceIcon(source.type)}
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="break-words font-medium">{sourceTitle(source)}</p>
        {detailLines.map((line, i) => (
          <p key={i} className="text-xs text-muted-foreground">{line}</p>
        ))}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-xs text-muted-foreground">{formatDate(source.createdAt)}</span>
        <button
          onClick={(e) => { e.stopPropagation(); ctx.onDelete(source.id, e); }}
          className="rounded p-1 text-muted-foreground opacity-0 transition-all hover:text-destructive group-hover:opacity-100"
          title={ctx.t("common.delete")}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

const sourceDetailLines = (source: Source, t: (key: string) => string): string[] => {
  switch (source.type) {
    case "postgres":
      return [`Port ${source.port} · ${t("sources.database")}: ${source.database}`]
    case "postgres-container":
      return [`${t("sources.database")}: ${source.database}`]
    case "container-volume": {
      const lines: string[] = []
      if (source.containerName)
        lines.push(`${t("sources.container")}: ${source.containerName}`)
      if (source.volumePath)
        lines.push(`${t("sources.volumePath")}: ${source.volumePath}`)
      if (source.include?.length)
        lines.push(`${t("sources.include")}: ${source.include.join(", ")}`)
      return lines
    }
    case "sqlite":
      return [source.path ?? ""]
    case "sqlite-container":
      return [`${t("sources.container")}: ${source.containerName}`]
    default:
      return []
  }
}

const sourceTitle = (source: Source): string => {
  switch (source.type) {
    case "path": return source.path ?? ""
    case "postgres": return source.host ?? ""
    case "postgres-container": return source.containerName ?? source.host ?? ""
    case "container-volume": return source.containerName ?? source.volumePath ?? ""
    case "sqlite": return source.path ?? ""
    case "sqlite-container": return source.containerName ?? ""
    default: return ""
  }
}

const countLeaves = (nodes: TreeNode[]): number =>
  nodes.reduce((sum, n) => sum + (n.children ? countLeaves(n.children) : 1), 0)

const buildSections = (sources: Source[]): SourceSection[] =>
  TYPE_ORDER
    .map((type) => {
      const items = sources.filter((s) => s.type === type)
      if (!items.length) return null

      if (type === "path") {
        const dirTree = buildPathTree(items)

        return {
          type,
          label: sourceTypeLabelKey(type),
          icon: sourceIcon(type),
          count: countLeaves(dirTree),
          dirTree,
          flatItems: [],
        }
      }

      return {
        type,
        label: sourceTypeLabelKey(type),
        icon: sourceIcon(type),
        count: items.length,
        dirTree: [],
        flatItems: items,
      }
    })
    .filter(Boolean) as SourceSection[]

const SourcesPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: sources, isLoading, isError, refetch } = useSources()
  const deleteSource = useDeleteSource()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleDelete = (id: string, e: MouseEvent) => {
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
            <Button onClick={() => navigate("/sources/new")}>
              <Plus className="mr-2 h-4 w-4" />
              {t("sources.addSource")}
            </Button>
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

  const sections = buildSections(sources ?? [])

  return (
    <div className="mx-auto max-w-5xl">
      <Header
        title={t("sources.title")}
        subtitle={t("sources.subtitle")}
        action={
          <Button onClick={() => navigate("/sources/new")}>
            <Plus className="mr-2 h-4 w-4" />
            {t("sources.addSource")}
          </Button>
        }
      />

      {!sections.length ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">{t("sources.noSources")}</p>
            <p className="mt-2 text-center text-sm">{t("sources.noSourcesDesc")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {sections.map((section) => (
            <section key={section.type}>
              <div className="mb-3 flex items-center gap-2 border-b pb-2">
                {section.icon}
                <h2 className="text-lg font-semibold">{t(section.label)}</h2>
                <span className="text-sm text-muted-foreground">({section.count})</span>
              </div>

              {section.dirTree.length ? (
                <TreeContext.Provider value={{ expanded, onToggle: toggle, onDelete: handleDelete, onNavigate: navigate, t }}>
                  <div className="rounded-lg border">
                    {section.dirTree.map((node) => (
                      <TreeNodeRow key={node.id} node={node} depth={0} />
                    ))}
                  </div>
                </TreeContext.Provider>
              ) : (
                <TreeContext.Provider value={{ expanded, onToggle: toggle, onDelete: handleDelete, onNavigate: navigate, t }}>
                  <div className="rounded-lg border">
                    {section.flatItems.map((source) => (
                      <SourceRow key={source.id} source={source} />
                    ))}
                  </div>
                </TreeContext.Provider>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

export default SourcesPage
