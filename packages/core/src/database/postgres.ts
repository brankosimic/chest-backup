import { $ } from "bun"
import { existsSync } from "node:fs"
import { join } from "node:path"
import type { ParsedConnString, PostgresContainerSource, PostgresSource, Source } from "../types/config"
import { logger } from "../utils/logger"

const UNMETADATA = "cluster"

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || UNMETADATA

const getPgDumpPath = (): string => {
  const versions = [18, 17, 16]

  const paths = versions.map((v) => `/usr/lib/postgresql/${String(v)}/bin/pg_dump`)
  return paths.find(existsSync) ?? "pg_dump"
}

const parseConnString = (connString: string): ParsedConnString => {
  const url = new URL(connString)
  return {
    host: url.hostname,
    port: parseInt(url.port, 10),
    user: url.username,
    password: url.password,
  }
}

const detectServerVersion = async (connString: string): Promise<number> => {
  try {
    const result = await $`psql ${connString} -t -A -c "SHOW server_version_num;"`.quiet().text()
    const versionNum = parseInt(result.trim(), 10)
    return Math.floor(versionNum / 10000)
  } catch {
    const sanitized = new URL(connString)
    sanitized.password = "***"
    logger.debug({ connString: sanitized.toString() }, "failed to detect server version, using fallback")
    return 18
  }
}

const dumpHostDatabase = async (connString: string, dbName: string | undefined, outputPath: string): Promise<void> => {
  const pgDump = getPgDumpPath()
  const serverVersion = await detectServerVersion(connString)
  logger.info({ serverVersion, pgDump }, "detected host database server version")

  if (dbName) await $`${pgDump} ${connString} -Fc -f ${outputPath}`.quiet()
  else {
    const { host, port, user, password } = parseConnString(connString)
    await $`PGPASSWORD=${password} ${pgDump}all -h ${host} -p ${port} -U ${user} -f ${outputPath}`.quiet()
  }
  logger.info({ outputPath, serverVersion }, "host database dump completed")
}

// The host path always runs pg_dumpall, so the dump covers every database on the
// server and is named after the server rather than a single database.
const hostDumpName = (source: PostgresSource): string =>
  `db-dump-${slugify(`${source.host}-${String(source.port)}`)}.dump`

const containerDumpName = (source: PostgresContainerSource): string =>
  `db-dump-${slugify(`${source.containerName}-${source.database}`)}.dump`

const dumpDockerDatabase = async (
  containerName: string,
  dbName: string | undefined,
  user: string | undefined,
  _password: string,
  outputPath: string,
): Promise<void> => {
  const tmpPath = `/tmp/db-dump-${crypto.randomUUID()}.dump`

  try {
    if (dbName) await $`docker exec ${containerName} pg_dump -U ${user} -d ${dbName} -Fc -f ${tmpPath}`.quiet()
    else await $`docker exec ${containerName} pg_dumpall -U ${user} -f ${tmpPath}`.quiet()

    await $`docker cp ${containerName}:${tmpPath} ${outputPath}`.quiet()
    await $`docker exec ${containerName} rm -f ${tmpPath}`.quiet()

    logger.info({ outputPath }, "docker database dump completed")
  } catch (err) {
    await $`docker exec ${containerName} rm -f ${tmpPath}`.nothrow().quiet()
    throw err
  }
}

const dumpSinglePostgresSource = async (
  source: PostgresSource,
  tempFiles: string[],
  tempDir: string,
  errors: string[],
): Promise<string | null> => {
  const outputPath = join(tempDir, hostDumpName(source))
  tempFiles.push(outputPath)
  try {
    await dumpHostDatabase(
      `postgresql://${source.user}:${source.password}@${source.host}:${String(source.port)}/${source.database}`,
      undefined,
      outputPath,
    )
    return outputPath
  } catch (err) {
    const message = `Postgres dump failed for ${source.database}: ${String(err)}`
    logger.error({ source: source.database, err }, "postgres dump failed")
    errors.push(message)
    return null
  }
}

const dumpPostgresSources = async (sources: Source[], tempFiles: string[], tempDir: string, errors: string[]): Promise<string[]> => {
  const postgresSources = sources.filter((s): s is PostgresSource => s.type === "postgres")
  if (!postgresSources.length) return []

  const results = await Promise.all(postgresSources.map((s) => dumpSinglePostgresSource(s, tempFiles, tempDir, errors)))
  return results.filter((r): r is string => r !== null)
}

const dumpPostgresContainerSources = async (
  sources: Source[],
  tempFiles: string[],
  tempDir: string,
  errors: string[],
): Promise<string[]> => {
  const containerSources = sources.filter((s): s is PostgresContainerSource => s.type === "postgres-container")
  if (!containerSources.length) return []

  const results = await Promise.all(
    containerSources.map(async (source) => {
      const outputPath = join(tempDir, containerDumpName(source))
      tempFiles.push(outputPath)
      try {
        await dumpDockerDatabase(source.containerName, source.database, source.user, source.password, outputPath)
        return outputPath
      } catch (err) {
        const message = `Postgres container dump failed for ${source.containerName}/${source.database}: ${String(err)}`
        logger.error({ source: source.containerName, err }, "container postgres dump failed")
        errors.push(message)
        return null
      }
    }),
  )
  return results.filter((r): r is string => r !== null)
}

export { dumpHostDatabase, dumpDockerDatabase, dumpPostgresSources, dumpPostgresContainerSources }
