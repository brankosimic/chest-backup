import { Component } from "react"
import { useTranslation } from "react-i18next"
import { AlertTriangle, RotateCw } from "lucide-react"
import type { ErrorBoundaryProps } from "@/types/ui"
import * as styles from "./error-boundary.styles"

interface ErrorBoundaryState {
  error: Error | null
}

interface ErrorFallbackProps {
  message: string
  onRetry: () => void
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error): void {
    console.error("ErrorBoundary caught:", error)
  }

  private reset = (): void => {
    this.setState({ error: null })
  }

  render(): React.ReactNode {
    const { error } = this.state
    if (!error) return this.props.children
    if (this.props.fallback) return this.props.fallback

    return <ErrorFallback message={error.message} onRetry={this.reset} />
  }
}

const ErrorFallback = ({ message, onRetry }: ErrorFallbackProps) => {
  const { t } = useTranslation()

  return (
    <div className={styles.wrapper}>
      <div className={styles.icon}>
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h2 className={styles.title}>{t("common.errorTitle")}</h2>
      <p className={styles.message}>{message}</p>
      <button type="button" onClick={onRetry} className={styles.retry}>
        <RotateCw className="h-4 w-4" />
        {t("common.tryAgain")}
      </button>
    </div>
  )
}

export { ErrorBoundary }
