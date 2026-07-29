import type { MouseEvent, ReactNode } from "react"
import type { Source } from "@chest-backup/shared"

export interface TreeContextValue {
  expanded: Set<string>
  onToggle: (id: string) => void
  onDelete: (id: string, e: MouseEvent) => void
  onNavigate: (path: string) => void
  t: (key: string) => string
}

export interface TreeNode {
  id: string
  label: string
  icon: ReactNode
  children?: TreeNode[]
  source?: Source
}

export interface TreeNodeRowProps {
  node: TreeNode
  depth: number
}

export interface SourceRowProps {
  source: Source
}

export interface SourceSection {
  type: string
  label: string
  icon: ReactNode
  count: number
  dirTree: TreeNode[]
  flatItems: Source[]
}

export interface PathTrieNode {
  source?: Source
  children: Map<string, PathTrieNode>
}
