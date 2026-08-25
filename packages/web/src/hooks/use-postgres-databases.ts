import { useState, useEffect, useCallback, useRef } from "react"
import { useTranslation } from "react-i18next"
import { fetchPostgresDatabases } from "@/lib/api-client"
import { SourceType } from "@/lib/sources"

type PgType = "postgres" | "postgres-container"

interface PostgresDatabasesParams {
  type: string
  host: string
  port: number
  user: string
  password: string
  containerName: string
  isPostgres: boolean
  fieldsReady: boolean
}

const usePostgresDatabases = (params: PostgresDatabasesParams) => {
  const { t } = useTranslation()
  const [databases, setDatabases] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const fetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchDbList = useCallback(async () => {
    if (!params.user || !params.password) return
    setLoading(true)
    setError("")
    try {
      const res = await fetchPostgresDatabases({
        type: params.type as PgType,
        host: params.type === SourceType.Postgres ? params.host : undefined,
        port: params.type === SourceType.Postgres ? params.port : undefined,
        user: params.user,
        password: params.password,
        containerName: params.type === SourceType.PostgresContainer ? params.containerName : undefined,
      })
      if (res.length) setDatabases(res)
      else {
        setDatabases([])
        setError(t("sources.noDatabases"))
      }
    } catch {
      setError(t("sources.fetchDatabasesError"))
    } finally {
      setLoading(false)
    }
  }, [params.type, params.host, params.port, params.user, params.password, params.containerName, t])

  useEffect(() => {
    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current)
    if (!params.isPostgres || !params.fieldsReady) return
    fetchTimerRef.current = setTimeout(() => {
      void fetchDbList()
    }, 600)
    return () => {
      if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current)
    }
  }, [fetchDbList, params.isPostgres, params.fieldsReady])

  useEffect(() => {
    if (!params.isPostgres) {
      setDatabases([])
      setError("")
    }
  }, [params.isPostgres])

  return { databases, loading, error }
}

export { usePostgresDatabases }
