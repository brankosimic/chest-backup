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

export type { FileTreeProps, TreeFileNode, TreeNode }
