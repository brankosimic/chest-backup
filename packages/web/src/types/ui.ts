import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import type { ResourceUsage, RestoreJob, LogLevel, BackupRecord } from "@chest-backup/shared"

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning"

type Theme = "light" | "dark" | "system"

type LanguageCode = "en" | "bs"

interface LanguageOption {
  code: LanguageCode
  labelKey: string
}

interface SheetProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  description?: ReactNode
  footer?: ReactNode
  children: ReactNode
  className?: string
}

interface TabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

interface TabsContextValue {
  value: string
  setValue: (value: string) => void
}

interface StatusBadgeProps {
  variant: BadgeVariant
  labelKey: string
}

interface DetailRowProps {
  label: string
  value: ReactNode
}

interface RestoreStatusMeta {
  variant: BadgeVariant
  labelKey: string
}

interface JobPanelProps {
  job: RestoreJob
}

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

type SkeletonProps = React.HTMLAttributes<HTMLDivElement>

interface TooltipProps {
  children: ReactNode
  content: ReactNode
  side?: "top" | "bottom"
  className?: string
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

interface ErrorFallbackProps {
  message: string
  onRetry: () => void
}

interface HeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
}

interface LogoProps {
  className?: string
}

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

interface ConnectionRow {
  label: string
  value: string
}

type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"

type ButtonSize = "default" | "sm" | "lg" | "icon"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement>

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
}

interface SwitchProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  className?: string
}

interface LoadingSpinnerProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant
}

interface SidebarProps {
  collapsed?: boolean
}

interface ThemeProviderProps {
  children: ReactNode
}

interface QueryProviderProps {
  children: ReactNode
}

interface MobileNavItemProps {
  item: NavItem
  pathname: string
  onNavigate: () => void
}

interface LogLevelButtonProps {
  level: LogLevel
  active: boolean
  onToggle: (level: LogLevel) => void
}

interface RestoreButtonProps {
  destinationId: string
  onRestore: (destinationId: string) => void
}

interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: ReactNode
  children?: ReactNode
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
}

interface DiskUsageRowProps {
  diskSpace: ResourceUsage
}

interface DiskUsageBlockProps {
  diskSpace: ResourceUsage | undefined
  isLoading: boolean
}

interface MobileRunRowProps {
  run: BackupRecord
  onSelect: (run: BackupRecord) => void
}

interface MobileRunItemProps {
  run: BackupRecord
}

interface DeleteButtonProps {
  id: string
}

export type {
  BadgeVariant,
  Theme,
  LanguageCode,
  LanguageOption,
  SheetProps,
  TabsProps,
  TabsTriggerProps,
  TabsContentProps,
  EmptyStateProps,
  SkeletonProps,
  TooltipProps,
  ErrorBoundaryProps,
  NavItem,
  ConnectionRow,
  ButtonVariant,
  ButtonSize,
  ButtonProps,
  InputProps,
  LabelProps,
  TextareaProps,
  SelectProps,
  SwitchProps,
  LoadingSpinnerProps,
  ErrorBoundaryState,
  ErrorFallbackProps,
  TabsContextValue,
  StatusBadgeProps,
  DetailRowProps,
  RestoreStatusMeta,
  JobPanelProps,
  HeaderProps,
  LogoProps,
  BadgeProps,
  SidebarProps,
  ThemeProviderProps,
  QueryProviderProps,
  MobileNavItemProps,
  LogLevelButtonProps,
  RestoreButtonProps,
  ConfirmDialogProps,
  DiskUsageRowProps,
  DiskUsageBlockProps,
  MobileRunRowProps,
  MobileRunItemProps,
  DeleteButtonProps,
}
