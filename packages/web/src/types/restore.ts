import type { RestoreSnapshotFile } from "@chest-backup/shared"

interface FileTreeProps {
  files: RestoreSnapshotFile[]
  search: string
  selected: Set<string>
  onTogglePath: (path: string) => void
  onToggleMany: (paths: string[], select: boolean) => void
}

interface TreeFileNode {
  kind: "file"
  name: string
  path: string
  size: number
}

interface TreeNode {
  kind: "dir"
  name: string
  path: string
  children: TreeNode[]
  files: TreeFileNode[]
  fileCount: number
  totalSize: number
}

interface FileRowProps {
  file: TreeFileNode
  selected: boolean
  onToggle: () => void
}

interface DirRowProps {
  node: TreeNode
  expanded: boolean
  selectionState: "none" | "some" | "all"
  onToggleExpand: () => void
  onToggleDir: () => void
}

interface TreeItemProps {
  node: TreeNode
  depth: number
  expandedDirs: Set<string>
  selected: Set<string>
  needle: string
  onToggleExpand: (path: string) => void
  onTogglePath: (path: string) => void
  onToggleMany: (paths: string[], select: boolean) => void
}

export type { FileTreeProps, TreeFileNode, TreeNode, FileRowProps, DirRowProps, TreeItemProps }
