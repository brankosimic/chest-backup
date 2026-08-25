import type { ContainerVolume } from "./backup"

interface SftpFieldsProps {
  host: string
  port: number
  user: string
  password: string
  privateKey: string
  timeout?: number
  onHostChange: (v: string) => void
  onPortChange: (v: number) => void
  onUserChange: (v: string) => void
  onPasswordChange: (v: string) => void
  onPrivateKeyChange: (v: string) => void
  onTimeoutChange: (v: number | undefined) => void
  labels: {
    host: string
    port: string
    user: string
    password: string
  }
}

interface PostgresFieldsProps {
  form: Record<string, unknown>
  update: (key: string, value: unknown) => void
  isContainer: boolean
}

interface SqliteFieldsProps {
  form: Record<string, unknown>
  update: (key: string, value: unknown) => void
  containers: string[]
  containersLoading: boolean
  containersError: string
}

interface ContainerVolumeFieldsProps {
  form: Record<string, unknown>
  update: (key: string, value: unknown) => void
  containers: string[]
  containersLoading: boolean
  containersError: string
  volumes: ContainerVolume[]
  volumesError: string
}

interface EditSourceFieldsProps {
  type: string
  form: Record<string, unknown>
  update: (key: string, value: unknown) => void
  containers: string[]
  containersLoading: boolean
  containersError: string
  volumes: ContainerVolume[]
  volumesError: string
}

interface ContainerSelectProps {
  id?: string
  label: string
  value: string
  onChange: (value: string) => void
  containers: string[]
  loading: boolean
  error: string
  allowCustomValue?: boolean
}

export type { SftpFieldsProps, PostgresFieldsProps, SqliteFieldsProps, ContainerVolumeFieldsProps, EditSourceFieldsProps, ContainerSelectProps }
