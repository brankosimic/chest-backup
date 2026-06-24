import { $ } from "bun"
import type { PostgresSource, Source } from "../types/config"
import { logger } from "../utils/logger"
import { existsSync } from "node:fs"

const getPgDumpPath = (): string => {
  const versions = [18, 17, 16]

  const paths = versions.map((v) => `/usr/lib/postgresql/${v}/bin/pg_dump`)
  return paths.find(existsSync) ?? "pg_dump"
}

const detectServerVersion = async (connString: string): Promise<number> => {
  try {
    const result = await $`psql ${connString} -t -A -c "SHOW server_version_num;"`.quiet().text()
    const versionNum = parseInt(result.trim(), 10)
    return Math.floor(versionNum / 10000)
  } catch {
    logger.debug({ connString }, "failed to detect server version, using fallback")
    return 18
  }
}

const dumpHostDatabase = async (connString: string, dbName: string | undefined, outputPath: string): Promise<void> => {
  const pgDump = getPgDumpPath()
  const serverVersion = await detectServerVersion(connString)
  logger.info({ serverVersion, pgDump }, "detected host database server version")

  const cmd = dbName
    ? `${pgDump} ${connString.replace(/\/[^/]+$/, `/${dbName}`)} -Fc -f ${outputPath}`
    : `${pgDump}all ${connString} -f ${outputPath}`

  await $`bash -c "${cmd}"`
  logger.info({ outputPath, serverVersion }, "host database dump completed")
}

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

const dumpPostgresSources = async (
  sources: Source[],
  timestamp: string,
  tempFiles: string[],
): Promise<string[]> => {
  const postgresSources = sources.filter((s): s is PostgresSource => s.type === "postgres")
  if (!postgresSources.length) return []

  return dumpPostgresSourceBatch(postgresSources, timestamp, tempFiles)
}

const dumpSinglePostgresSource = async (
  source: PostgresSource,
  timestamp: string,
  tempFiles: string[],
): Promise<string | null> => {
  const outputPath = `/tmp/db-dump-${timestamp}-${crypto.randomUUID()}.dump`
  tempFiles.push(outputPath)
  try {
    await dumpHostDatabase(
      `postgresql://${source.user}:${source.password}@${source.host}:${source.port}/${source.database}`,
      undefined,
      outputPath,
    )
    return outputPath
  } catch (err) {
    logger.error({ source: source.database, err }, "postgres dump failed")
    return null
  }
}

const dumpPostgresSourceBatch = async (
  sources: PostgresSource[],
  timestamp: string,
  tempFiles: string[],
): Promise<string[]> => {
  const results = await Promise.all(sources.map((s) => dumpSinglePostgresSource(s, timestamp, tempFiles)))
  return results.filter((r): r is string => r !== null)
}

export { dumpHostDatabase, dumpDockerDatabase, dumpPostgresSources }
