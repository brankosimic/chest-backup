import { useState, useEffect } from "react"

const ErrorBoundary = ({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) => {
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setHasError(true)
      console.error("ErrorBoundary caught:", event.error)
    }

    window.addEventListener("error", handleError)
    return () => { window.removeEventListener("error", handleError) }
  }, [])

  if (hasError) {
    return <>{fallback ?? <div className="flex min-h-[200px] items-center justify-center text-destructive">Something went wrong.</div>}</>
  }

  return <>{children}</>
}

export { ErrorBoundary }
