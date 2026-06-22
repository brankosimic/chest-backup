import { $ } from "bun"
import { logger } from "../utils/logger"

async function dumpHostDatabase(
  connString: string,
  dbName: string | undefined,
  outputPath: string,
): Promise<void> {
  if (dbName) {
    await $`pg_dump ${connString} -d ${dbName} -Fc -f ${outputPath}`.quiet()
  } else {
    await $`pg_dumpall ${connString} -f ${outputPath}`.quiet()
  }
  logger.info({ outputPath }, "host database dump completed")
}

async function dumpDockerDatabase(
  containerName: string,
  dbName: string | undefined,
  user: string | undefined,
  _password: string,
  outputPath: string,
): Promise<void> {
  const tmpPath = `/tmp/db-dump-${crypto.randomUUID()}.dump`

  try {
    if (dbName) {
      await $`docker exec ${containerName} pg_dump -U ${user} -d ${dbName} -Fc -f ${tmpPath}`.quiet()
    } else {
      await $`docker exec ${containerName} pg_dumpall -U ${user} -f ${tmpPath}`.quiet()
    }

    await $`docker cp ${containerName}:${tmpPath} ${outputPath}`.quiet()
    await $`docker exec ${containerName} rm -f ${tmpPath}`.quiet()

    logger.info({ outputPath }, "docker database dump completed")
  } catch (err) {
    await $`docker exec ${containerName} rm -f ${tmpPath}`.nothrow().quiet()
    throw err
  }
}

export { dumpHostDatabase, dumpDockerDatabase }
