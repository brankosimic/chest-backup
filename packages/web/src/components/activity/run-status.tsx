import { useTranslation } from "react-i18next"
import { RunStatus, RunTrigger } from "@chest-backup/shared"
import { CheckCircle2, AlertTriangle, XCircle, MinusCircle, Loader2, Zap, CalendarClock, CircleHelp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { StatusMeta } from "@/types/activity"
import type { RunStatusBadgeProps, TriggerBadgeProps } from "@/types/backup"
import * as styles from "./run-status.styles"

const statusMeta = (status?: RunStatus): StatusMeta => {
  if (!status) {
    return {
      labelKey: "common.unknown",
      variant: "outline",
      icon: <CircleHelp className="h-4 w-4" />,
      dot: "bg-muted-foreground",
    }
  }
  if (status === RunStatus.Success) {
    return {
      labelKey: "status.success",
      variant: "success",
      icon: <CheckCircle2 className="h-4 w-4" />,
      dot: "bg-success",
    }
  }
  if (status === RunStatus.Partial) {
    return {
      labelKey: "status.partial",
      variant: "warning",
      icon: <AlertTriangle className="h-4 w-4" />,
      dot: "bg-warning",
    }
  }
  if (status === RunStatus.Failed) {
    return {
      labelKey: "status.failed",
      variant: "destructive",
      icon: <XCircle className="h-4 w-4" />,
      dot: "bg-destructive",
    }
  }
  if (status === RunStatus.Skipped) {
    return {
      labelKey: "status.skipped",
      variant: "secondary",
      icon: <MinusCircle className="h-4 w-4" />,
      dot: "bg-muted-foreground",
    }
  }
  return {
    labelKey: "status.running",
    variant: "default",
    icon: <Loader2 className="h-4 w-4 animate-spin" />,
    dot: "bg-primary animate-pulse",
  }
}

const RunStatusBadge = ({ status, className }: RunStatusBadgeProps) => {
  const { t } = useTranslation()
  const meta = statusMeta(status)

  return (
    <Badge variant={meta.variant} className={`${styles.badge} ${className ?? ""}`}>
      {meta.icon}
      {t(meta.labelKey)}
    </Badge>
  )
}

const TriggerBadge = ({ trigger, className }: TriggerBadgeProps) => {
  const { t } = useTranslation()
  const Icon = trigger === RunTrigger.Manual ? Zap : CalendarClock

  return (
    <Badge variant="outline" className={`${styles.triggerBadge} ${className ?? ""}`}>
      <Icon className="h-3 w-3" />
      {t(trigger === RunTrigger.Manual ? "activity.trigger.manual" : "activity.trigger.scheduled")}
    </Badge>
  )
}

export { statusMeta, RunStatusBadge, TriggerBadge }
