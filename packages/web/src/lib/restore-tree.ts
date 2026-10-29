import type { RestoreSnapshotFile } from "@chest-backup/shared"
import type { TreeNode } from "@/types/restore"

const compareNodes = (a: TreeNode, b: TreeNode): number => a.name.localeCompare(b.name)

const insertFile = (parent: TreeNode, segments: string[], index: number, file: RestoreSnapshotFile): void => {
  if (index === segments.length - 1) {
    parent.files.push({ kind: "file", name: segments[index], path: file.path, size: file.size })
    return
  }

  const segment = segments[index]
  let child = parent.children.find((node) => node.name === segment)
  if (!child) {
    child = { kind: "dir", name: segment, path: `${parent.path}/${segment}`.replace(/^\/+/, ""), children: [], files: [], fileCount: 0, totalSize: 0 }
    parent.children.push(child)
  }
  insertFile(child, segments, index + 1, file)
}

const finalizeNode = (node: TreeNode): TreeNode => {
  node.children = node.children.map(finalizeNode).sort(compareNodes)
  node.files.sort((a, b) => a.name.localeCompare(b.name))
  node.fileCount = node.files.length + node.children.reduce((acc, child) => acc + child.fileCount, 0)
  node.totalSize = node.files.reduce((acc, file) => acc + file.size, 0) + node.children.reduce((acc, child) => acc + child.totalSize, 0)
  return node
}

const buildTree = (files: RestoreSnapshotFile[]): TreeNode => {
  const root: TreeNode = { kind: "dir", name: "", path: "", children: [], files: [], fileCount: 0, totalSize: 0 }
  for (const file of files) insertFile(root, file.path.split("/"), 0, file)
  return finalizeNode(root)
}

const collectPaths = (node: TreeNode, acc: string[]): void => {
  for (const file of node.files) acc.push(file.path)
  for (const child of node.children) collectPaths(child, acc)
}

export { buildTree, collectPaths }
