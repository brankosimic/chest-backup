import { $ } from "bun"
import type { Config } from "../types/config"
import { logger } from "../utils/logger"

const dumpHostDatabase = async (connString: string, dbName: string | undefined, outputPath: string): Promise<void> => {
  if (dbName) {
    const dbOnly = connString.replace(/\/[^/]+$/, `/${dbName}`)
    await $`pg_dump ${dbOnly} -Fc -f ${outputPath}`.quiet()
  } else {
    await $`pg_dumpall ${connString} -f ${outputPath}`.quiet()
  }
  logger.info({ outputPath }, "host database dump completed")
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

const dumpDatabases = async (
  config: Config,
  timestamp: string,
  tempFiles: string[],
  errors: string[],
): Promise<string[]> => {
  if (!config.databases?.length) return []

  const dbDumps: string[] = []
  for (const db of config.databases) {
    const outputPath = `/tmp/db-dump-${timestamp}-${crypto.randomUUID()}.dump`
    tempFiles.push(outputPath)
    try {
      if (db.type === "host" && db.connectionString) {
        await dumpHostDatabase(db.connectionString, db.database, outputPath)
      } else if (db.type === "docker" && db.containerName) {
        await dumpDockerDatabase(db.containerName, db.database, db.username, db.password ?? "", outputPath)
      }
      dbDumps.push(outputPath)
    } catch (err) {
      errors.push(`Database dump failed: ${String(err)}`)
    }
  }
  return dbDumps
}

export { dumpHostDatabase, dumpDockerDatabase, dumpDatabases }
