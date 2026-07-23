import type { PostgresQuery, PostgresQueryResult, DockerMount, ContainerVolume } from "../types/sources"
import { $ } from "bun"
import { Hono } from "hono"
import { SourceSchema, PostgresDatabasesSchema } from "../lib/validation"
import { createSource, getSources, updateSource, deleteSource, findSourceById } from "../lib/store"
import { validateBody, notFound } from "../lib/routes"

const sources = new Hono()

const fetchPostgresDatabases = async (data: PostgresQuery): Promise<PostgresQueryResult> => {
  const sourceData = data
  if (sourceData.type === "postgres") {
    if (!sourceData.host) return { success: false, message: "Host is required" }
    try {
      const dbFlag = sourceData.database ? `-d ${sourceData.database}` : `-d template1`
      const cmd = `PGPASSWORD=${sourceData.password} psql -h ${sourceData.host} -p ${sourceData.port ?? 5432} -U ${sourceData.user} ${dbFlag} -t -A -c "SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname;"`
      const result = await $`bash -c ${cmd}`.quiet().text()
      const databases = result.trim().split("\n").filter(Boolean).map((d) => d.trim())
      return { success: true, databases }
    } catch (err: unknown) {
      return { success: false, message: err instanceof Error ? err.message : "Failed to fetch databases" }
    }
  }
  if (!sourceData.containerName) return { success: false, message: "Container name is required" }
  try {
    const dbFlag = sourceData.database ? `-d ${sourceData.database}` : `-d template1`
    const result = await $`docker exec ${sourceData.containerName} psql -U ${sourceData.user} ${dbFlag} -t -A -c "SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname;"`.quiet().text()
    const databases = result.trim().split("\n").filter(Boolean).map((d) => d.trim())
    return { success: true, databases }
  } catch (err: unknown) {
    return { success: false, message: err instanceof Error ? err.message : "Failed to fetch databases" }
  }
}
// Static routes must be registered before parameterized ones

sources.get("/", (c) => {
  const data = getSources()
  return c.json({ success: true, data })
})

sources.post("/", async (c) => {
  const result = await validateBody(SourceSchema, c)
  if (!result.ok) return result.error
  const source = createSource(result.data)
  return c.json({ success: true, data: source }, 201)
})

sources.get("/containers", async (c) => {
  try {
    const result = await $`docker ps --format '{{.Names}}'`.quiet().text()
    const containers = result.trim().split("\n").filter(Boolean).map((n) => n.trim()).sort()
    return c.json({ success: true, data: containers })
  } catch {
    return c.json({ success: true, data: [] })
  }
})

sources.get("/containers/:name/volumes", async (c) => {
  const name = c.req.param("name")
  try {
    const result = await $`docker inspect ${name} --format '{{json .Mounts}}'`.quiet().text()
    const mounts: DockerMount[] = JSON.parse(result.trim())
    const volumes: ContainerVolume[] = mounts.map((m) => ({
      type: m.Type,
      source: m.Source,
      destination: m.Destination,
      name: m.Name,
      rw: m.RW,
    }))
    return c.json({ success: true, data: volumes })
  } catch {
    return c.json({ success: true, data: [] })
  }
})

sources.post("/databases", async (c) => {
  const result = await validateBody(PostgresDatabasesSchema, c)
  if (!result.ok) return result.error
  const res = await fetchPostgresDatabases(result.data)
  return c.json({ success: res.success, data: res.databases })
})

sources.get("/:id", (c) => {
  const id = c.req.param("id")
  const source = findSourceById(id)
  if (!source) return notFound(c, "Source")
  return c.json({ success: true, data: source })
})

sources.put("/:id", async (c) => {
  const id = c.req.param("id")
  const result = await validateBody(SourceSchema, c)
  if (!result.ok) return result.error
  const updated = updateSource(id, result.data)
  if (!updated) return notFound(c, "Source")
  return c.json({ success: true, data: updated })
})

sources.delete("/:id", (c) => {
  const id = c.req.param("id")
  const deleted = deleteSource(id)
  if (!deleted) return notFound(c, "Source")
  return c.json({ success: true, data: null })
})

export { sources }
