import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { fetchDockerContainers } from "@/lib/api-client"

const useDockerContainers = (enabled = true) => {
  const { t } = useTranslation()
  const [containers, setContainers] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!enabled) return
    setLoading(true)
    setError("")
    fetchDockerContainers()
      .then(setContainers)
      .catch(() => {
        setError(t("sources.containersError"))
      })
      .finally(() => {
        setLoading(false)
      })
  }, [t, enabled])

  return { containers, loading, error }
}

export { useDockerContainers }
