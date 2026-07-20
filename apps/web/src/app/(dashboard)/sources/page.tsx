import { useState, createContext, useContext } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Header } from "@/components/layout/header"
import { Plus, Folder, FolderOpen, File, Database, Container, Boxes, Trash2, ChevronRight } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { useSources, useDeleteSource } from "@/hooks/use-queries"
import type { Source } from "@chest-backup/shared"

interface TreeContextValue {
  expanded: Set<string>
  onToggle: (id: string) => void
  onDelete: (id: string, e: React.MouseEvent) => void
  onNavigate: (path: string) => void
  t: (key: string) => string
}

const TreeContext = createContext<TreeContextValue | null>(null)

const useTree = () => {
  const ctx = useContext(TreeContext)
  if (!ctx) throw new Error("useTree must be used within TreeContext.Provider")
  return ctx
}

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

interface TreeNode {
  id: string
  label: string
  icon: React.ReactNode
  children?: TreeNode[]
  source?: Source
}

interface TreeNodeRowProps {
  node: TreeNode
  depth: number
}

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
            <span className="h-3.5 w-3.5 text-muted-foreground">-</span>
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

interface SourceRowProps {
  source: Source
}

const SourceRow = ({ source }: SourceRowProps) => {
  const ctx = useTree()

  return (
    <div
      className="group flex cursor-pointer items-center gap-2 px-4 py-2 hover:bg-muted/50"
      onClick={() => ctx.onNavigate(`/sources/${source.id}`)}
    >
      <span className="flex w-4 shrink-0 items-center justify-center">
        <span className="h-3.5 w-3.5 text-muted-foreground">-</span>
      </span>
      {sourceIcon(source.type)}
      <span className="min-w-0 flex-1 break-words font-medium">{sourceTitle(source)}</span>
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

interface SourceSection {
  type: string
  label: string
  icon: React.ReactNode
  count: number
  dirTree: TreeNode[]
  flatItems: Source[]
}

const countLeaves = (nodes: TreeNode[]): number =>
  nodes.reduce((sum, n) => sum + (n.children ? countLeaves(n.children) : 1), 0)

const buildSections = (sources: Source[]): SourceSection[] =>
  TYPE_ORDER
    .map((type) => {
      const items = sources.filter((s) => s.type === type)
      if (!items.length) return null

      if (type === "path") {
        const byParent = Array.from(
          items.reduce<Map<string, Source[]>>((map, s) => {
            const parent = getParentDir(s.path ?? "")
            if (!map.has(parent)) map.set(parent, [])
            map.get(parent)!.push(s)
            return map
          }, new Map())
        )

        const dirTree: TreeNode[] = byParent.map(([parent, children]) => ({
          id: `dir-${parent}`,
          label: `${parent}/`,
          icon: <FolderOpen className="h-4 w-4 text-amber-500 shrink-0" />,
          children: children.map((s) => ({
            id: s.id,
            label: getBaseName(s.path ?? ""),
            icon: <File className="h-4 w-4 text-muted-foreground shrink-0" />,
            source: s,
          })),
        }))

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

export default function SourcesPage() {
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

  const handleDelete = (id: string, e: React.MouseEvent) => {
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
