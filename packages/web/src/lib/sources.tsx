import type { Source } from "@chest-backup/shared"
import type { TreeNode, PathTrieNode } from "@/types/sources"
import { Folder, Database, Container, File, FolderOpen, HardDrive } from "lucide-react"

const SourceType = {
  Path: "path",
  Postgres: "postgres",
  PostgresContainer: "postgres-container",
  ContainerVolume: "container-volume",
  Sqlite: "sqlite",
  SqliteContainer: "sqlite-container",
} as const

export type SourceTypeValue = (typeof SourceType)[keyof typeof SourceType]

const SOURCE_TYPES: string[] = Object.values(SourceType)

const sourceIcon = (type: string) => {
  switch (type) {
    case SourceType.Path:
      return <Folder className="h-5 w-5 text-blue-500 shrink-0" />
    case SourceType.Postgres:
      return <Database className="h-5 w-5 text-purple-500 shrink-0" />
    case SourceType.PostgresContainer:
      return <Container className="h-5 w-5 text-amber-500 shrink-0" />
    case SourceType.ContainerVolume:
      return <HardDrive className="h-5 w-5 text-green-500 shrink-0" />
    case SourceType.Sqlite:
      return <Database className="h-5 w-5 text-teal-500 shrink-0" />
    case SourceType.SqliteContainer:
      return <Container className="h-5 w-5 text-cyan-500 shrink-0" />
    default:
      return <Folder className="h-5 w-5 text-muted-foreground shrink-0" />
  }
}

const walkOrCreate = (node: PathTrieNode, segments: string[]): PathTrieNode => {
  let current = node

  for (const seg of segments) {
    if (!current.children.has(seg)) current.children.set(seg, { children: new Map() })
    const next = current.children.get(seg)
    if (!next) throw new Error(`Unexpected missing child: ${seg}`)
    current = next
  }

  return current
}

const insertOne = (root: PathTrieNode, s: Source): void => {
  const path = s.path ?? ""
  if (!path) return
  const segments = path.split("/").filter(Boolean)
  walkOrCreate(root, segments).source = s
}

const leafTreeNode = (seg: string, source: Source): TreeNode => ({
  id: source.id,
  label: seg,
  icon: <File className="h-4 w-4 text-muted-foreground shrink-0" />,
  source,
})

const dirTreeNode = (seg: string, fullPath: string, children: TreeNode[]): TreeNode => ({
  id: `dir-${fullPath}`,
  label: seg,
  icon: <FolderOpen className="h-4 w-4 text-amber-500 shrink-0" />,
  children,
})

const fileTreeNode = (seg: string, fullPath: string, source?: Source): TreeNode => ({
  id: source?.id ?? `path-${fullPath}`,
  label: seg,
  icon: <Folder className="h-4 w-4 text-muted-foreground shrink-0" />,
  source,
})

const processNode = (seg: string, child: PathTrieNode, prefix: string): TreeNode => {
  const fullPath = prefix ? `${prefix}/${seg}` : seg
  const hasChildren = child.children.size > 0

  if (hasChildren) {
    const children: TreeNode[] = []

    if (child.source) {
      children.push(leafTreeNode(seg, child.source))
    }

    children.push(...toTreeNodes(child, fullPath))

    return dirTreeNode(seg, fullPath, children)
  }

  return fileTreeNode(seg, fullPath, child.source)
}

const toTreeNodes = (node: PathTrieNode, prefix: string): TreeNode[] =>
  [...node.children.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([seg, child]) => processNode(seg, child, prefix))

const buildPathTree = (sources: Source[]): TreeNode[] => {
  const root: PathTrieNode = { children: new Map() }

  sources.forEach((s) => { insertOne(root, s) })

  return toTreeNodes(root, "")
}

const sourceTitle = (source: Source): string => {
  switch (source.type) {
    case SourceType.Path:
      return source.path ?? ""
    case SourceType.Postgres:
      return source.host ?? ""
    case SourceType.PostgresContainer:
      return source.containerName ?? source.host ?? ""
    case SourceType.ContainerVolume:
      return source.containerName ?? source.volumePath ?? ""
    case SourceType.Sqlite:
      return source.path ?? ""
    case SourceType.SqliteContainer:
      return source.containerName ?? ""
    default:
      return ""
  }
}

const containerVolumeDetailLines = (source: Source, t: (key: string) => string): string[] => {
  const lines: string[] = []

  if (source.containerName) lines.push(`${t("sources.container")}: ${source.containerName}`)
  if (source.volumePath) lines.push(`${t("sources.volumePath")}: ${source.volumePath}`)
  if (source.include?.length) lines.push(`${t("sources.include")}: ${source.include.join(", ")}`)

  return lines
}

const sourceDetailLines = (source: Source, t: (key: string) => string): string[] => {
  switch (source.type) {
    case SourceType.Postgres:
      return [`Port ${String(source.port)} · ${t("sources.database")}: ${source.database ?? ""}`]
    case SourceType.PostgresContainer:
      return [`${t("sources.database")}: ${source.database ?? ""}`]
    case SourceType.ContainerVolume:
      return containerVolumeDetailLines(source, t)
    case SourceType.Sqlite:
      return [source.path ?? ""]
    case SourceType.SqliteContainer:
      return [`${t("sources.container")}: ${source.containerName ?? ""}`]
    default:
      return []
  }
}

const getSourceTypeDefault = (type: SourceTypeValue, source: Record<string, unknown>): Record<string, unknown> => {
  switch (type) {
    case SourceType.Path:
      return { path: source.path ?? "" }
    case SourceType.Postgres:
      return {
        host: source.host ?? "localhost",
        port: source.port ?? 5432,
        user: source.user ?? "",
        password: source.password ?? "",
        database: source.database ?? "",
      }
    case SourceType.PostgresContainer:
      return {
        containerName: source.containerName ?? "",
        user: source.user ?? "",
        password: source.password ?? "",
        database: source.database ?? "",
      }
    case SourceType.ContainerVolume:
      return {
        containerName: source.containerName ?? "",
        volumePath: source.volumePath ?? "",
        include: (source.include as string[] | undefined)?.join("\n") ?? "",
      }
    case SourceType.Sqlite:
      return {
        path: source.path ?? "",
      }
    case SourceType.SqliteContainer:
      return {
        containerName: source.containerName ?? "",
        dbPath: source.dbPath ?? "",
      }
    default:
      return {}
  }
}

const sourceTypeLabelKey = (type: string): string => {
  switch (type) {
    case SourceType.Path:
      return "sources.typePath"
    case SourceType.Postgres:
      return "sources.typePostgres"
    case SourceType.PostgresContainer:
      return "sources.typePostgresContainer"
    case SourceType.ContainerVolume:
      return "sources.typeContainerVolume"
    case SourceType.Sqlite:
      return "sources.typeSqlite"
    case SourceType.SqliteContainer:
      return "sources.typeSqliteContainer"
    default:
      return type
  }
}

const parseIncludePatterns = (include: string): string[] =>
  include
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)

export {
  SourceType,
  sourceIcon,
  sourceTypeLabelKey,
  buildPathTree,
  sourceTitle,
  sourceDetailLines,
  getSourceTypeDefault,
  parseIncludePatterns,
  SOURCE_TYPES,
}
