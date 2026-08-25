import { createContext, useContext, useState, useEffect, type ReactNode, type SubmitEvent } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useCreateSource } from "@/hooks/use-queries"
import type { NewSourceFormValue } from "@/types/sources"
import { useDockerContainers } from "./use-docker-containers"
import { usePostgresDatabases } from "./use-postgres-databases"
import { useContainerVolumes } from "./use-container-volumes"
import { parseIncludePatterns, SourceType } from "@/lib/sources"

const NewSourceFormContext = createContext<NewSourceFormValue | null>(null)

const useNewSourceForm = () => {
  const ctx = useContext(NewSourceFormContext)
  if (!ctx) throw new Error("useNewSourceForm must be used within NewSourceFormProvider")
  return ctx
}

const NewSourceFormProvider = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const createMutation = useCreateSource()

  const [type, setType] = useState<string>(SourceType.Path)
  const [path, setPath] = useState("")
  const [host, setHost] = useState("localhost")
  const [port, setPort] = useState(5432)
  const [user, setUser] = useState("")
  const [password, setPassword] = useState("")
  const [database, setDatabase] = useState("")
  const [containerName, setContainerName] = useState("")
  const [dbPath, setDbPath] = useState("")
  const [cvContainerName, setCvContainerName] = useState("")
  const [volumePath, setVolumePath] = useState("")
  const [include, setInclude] = useState("")

  const isPostgres = type === SourceType.Postgres || type === SourceType.PostgresContainer
  const isContainer = type === SourceType.PostgresContainer
  const fieldsReady = !!(isContainer ? user && password && containerName : user && password && host)

  const needsContainers =
    type === SourceType.PostgresContainer || type === SourceType.ContainerVolume || type === SourceType.SqliteContainer

  const { containers: dockerContainers, loading: dockerContainersLoading, error: dockerContainersError } =
    useDockerContainers(needsContainers)
  const pgDb = usePostgresDatabases({
    type,
    host,
    port,
    user,
    password,
    containerName,
    isPostgres,
    fieldsReady,
  })
  const cv = useContainerVolumes({ containerName: cvContainerName, type })

  const canCreate = isPostgres
    ? !!(fieldsReady && database)
    : type === SourceType.ContainerVolume
      ? !!(cvContainerName && volumePath)
      : type === SourceType.Sqlite
        ? !!path
        : type === SourceType.SqliteContainer
          ? !!(containerName && dbPath)
          : !!path

  useEffect(() => {
    setDatabase("")
    setContainerName("")
    setCvContainerName("")
    setVolumePath("")
    setInclude("")
  }, [type])

  const buildBody = (): Record<string, unknown> => {
    const body: Record<string, unknown> = { type }

    switch (type) {
      case SourceType.Path:
        body.path = path
        break
      case SourceType.Postgres:
        body.host = host
        body.port = port
        body.user = user
        body.password = password
        body.database = database
        break
      case SourceType.PostgresContainer:
        body.containerName = containerName
        body.user = user
        body.password = password
        body.database = database
        break
      case SourceType.ContainerVolume: {
        body.containerName = cvContainerName
        body.volumePath = volumePath
        const patterns = parseIncludePatterns(include)
        if (patterns.length) body.include = patterns
        break
      }
      case SourceType.Sqlite:
        body.path = path
        break
      case SourceType.SqliteContainer:
        body.containerName = containerName
        body.dbPath = dbPath
        break
    }

    return body
  }

  const handleCreate = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()

    createMutation
      .mutateAsync(buildBody())
      .then(() => {
        void navigate("/sources")
      })
      .catch(() => {
        alert(t("sources.createError"))
      })
  }

  const value: NewSourceFormValue = {
    type,
    setType,
    path,
    setPath,
    host,
    setHost,
    port,
    setPort,
    user,
    setUser,
    password,
    setPassword,
    database,
    setDatabase,
    containerName,
    setContainerName,
    dbPath,
    setDbPath,
    cvContainerName,
    setCvContainerName,
    volumePath,
    setVolumePath,
    include,
    setInclude,
    cvVolumes: cv.volumes,
    cvVolumesError: cv.error,
    dockerContainers,
    dockerContainersLoading,
    dockerContainersError,
    databases: pgDb.databases,
    databasesLoading: pgDb.loading,
    databasesError: pgDb.error,
    isPostgres,
    isContainer,
    fieldsReady,
    canCreate,
    createPending: createMutation.isPending,
    handleCreate,
  }

  return <NewSourceFormContext.Provider value={value}>{children}</NewSourceFormContext.Provider>
}

export { useNewSourceForm, NewSourceFormProvider }
