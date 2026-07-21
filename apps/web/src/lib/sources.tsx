import { Folder, Database, Container, File, FolderOpen, HardDrive } from "lucide-react"
import type { Source } from "@chest-backup/shared"
import type { TreeNode, PathTrieNode } from "@/types/sources"

const sourceIcon = (type: string) => {
  switch (type) {
    case "path": return <Folder className="h-5 w-5 text-blue-500 shrink-0" />
    case "postgres": return <Database className="h-5 w-5 text-purple-500 shrink-0" />
    case "postgres-container": return <Container className="h-5 w-5 text-amber-500 shrink-0" />
    case "container-volume": return <HardDrive className="h-5 w-5 text-green-500 shrink-0" />
    default: return <Folder className="h-5 w-5 text-muted-foreground shrink-0" />
  }
}

const walkOrCreate = (node: PathTrieNode, segments: string[]): PathTrieNode => {
  let current = node
  for (const seg of segments) {
    if (!current.children.has(seg))
      current.children.set(seg, { children: new Map() })
    current = current.children.get(seg)!
  }
  return current
}

const insertOne = (root: PathTrieNode, s: Source): void => {
  const path = s.path ?? ""
  if (!path) return
  const segments = path.split("/").filter(Boolean)
  walkOrCreate(root, segments).source = s
}

const processNode = (
  seg: string,
  child: PathTrieNode,
  prefix: string,
): TreeNode => {
  const fullPath = prefix ? `${prefix}/${seg}` : seg
  const hasChildren = child.children.size > 0

  if (hasChildren) {
    const children: TreeNode[] = []

    if (child.source) {
      children.push({
        id: child.source.id,
        label: seg,
        icon: <File className="h-4 w-4 text-muted-foreground shrink-0" />,
        source: child.source,
      })
    }

    children.push(...toTreeNodes(child, fullPath))

    return {
      id: `dir-${fullPath}`,
      label: seg,
      icon: <FolderOpen className="h-4 w-4 text-amber-500 shrink-0" />,
      children,
    }
  }

  return {
    id: child.source?.id ?? `path-${fullPath}`,
    label: seg,
    icon: <File className="h-4 w-4 text-muted-foreground shrink-0" />,
    source: child.source,
  }
}

const toTreeNodes = (node: PathTrieNode, prefix: string): TreeNode[] => {
  const result: TreeNode[] = []
  const entries = [...node.children.entries()].sort(([a], [b]) => a.localeCompare(b))

  for (const [seg, child] of entries)
    result.push(processNode(seg, child, prefix))

  return result
}

const buildPathTree = (sources: Source[]): TreeNode[] => {
  const root: PathTrieNode = { children: new Map() }

  for (const s of sources) insertOne(root, s)

  return toTreeNodes(root, "")
}

const sourceTypeLabelKey = (type: string): string => {
  switch (type) {
    case "path": return "sources.typePath"
    case "postgres": return "sources.typePostgres"
    case "postgres-container": return "sources.typePostgresContainer"
    case "container-volume": return "sources.typeContainerVolume"
    default: return type
  }
}

export { sourceIcon, sourceTypeLabelKey, buildPathTree }
