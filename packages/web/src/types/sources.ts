import type { MouseEvent, ReactNode, SubmitEvent } from "react"
import type { Source } from "@chest-backup/shared"
import type { ContainerVolume } from "./backup"

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

export interface NewSourceFormValue {
  type: string
  setType: (v: string) => void
  path: string
  setPath: (v: string) => void
  host: string
  setHost: (v: string) => void
  port: number
  setPort: (v: number) => void
  user: string
  setUser: (v: string) => void
  password: string
  setPassword: (v: string) => void
  database: string
  setDatabase: (v: string) => void
  containerName: string
  setContainerName: (v: string) => void
  dbPath: string
  setDbPath: (v: string) => void
  cvContainerName: string
  setCvContainerName: (v: string) => void
  volumePath: string
  setVolumePath: (v: string) => void
  include: string
  setInclude: (v: string) => void
  cvVolumes: ContainerVolume[]
  cvVolumesError: string
  dockerContainers: string[]
  dockerContainersLoading: boolean
  dockerContainersError: string
  databases: string[]
  databasesLoading: boolean
  databasesError: string
  isPostgres: boolean
  isContainer: boolean
  fieldsReady: boolean
  canCreate: boolean
  createPending: boolean
  handleCreate: (e: SubmitEvent<HTMLFormElement>) => void
}
