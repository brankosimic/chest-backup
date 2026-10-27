import type { ReactNode } from "react"

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning"

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

export type {
  BadgeVariant,
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
}
