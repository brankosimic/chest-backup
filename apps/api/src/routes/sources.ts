import { $ } from "bun"
import { Hono } from "hono"
import { SourceSchema, PostgresTestSchema, PostgresDatabasesSchema } from "../lib/validation"
import { createSource, getSources, updateSource, deleteSource } from "../lib/store"
import { validateBody, notFound } from "../lib/routes"

const sources = new Hono()

const testPostgresConnection = async (data: { type: "postgres" | "postgres-container"; host?: string; port?: number; user: string; password: string; containerName?: string; database?: string }): Promise<{ success: boolean; message?: string }> => {
  const { type, host, port, user, password, containerName, database } = data
  if (type === "postgres") {
    if (!host) return { success: false, message: "Host is required" }
    try {
      const dbFlag = database ? `-d ${database}` : `-d template1`
      const cmd = `PGPASSWORD=${password} psql -h ${host} -p ${port ?? 5432} -U ${user} ${dbFlag} -t -A -c "SELECT 1;"`
      const result = await $`bash -c ${cmd}`.quiet().text()
      return { success: true, message: result.trim() }
    } catch (err: unknown) {
      const exitCode = (err as { exitCode?: number }).exitCode
      return { success: false, message: exitCode !== undefined ? `Failed with exit code ${exitCode}` : (err instanceof Error ? err.message : "Connection failed") }
    }
  }
  if (!containerName) return { success: false, message: "Container name is required" }
  try {
    const dbFlag = database ? `-d ${database}` : `-d template1`
    const result = await $`docker exec ${containerName} psql -U ${user} ${dbFlag} -t -A -c "SELECT 1;"`.quiet().text()
    return { success: true, message: result.trim() }
  } catch (err: unknown) {
    return { success: false, message: err instanceof Error ? err.message : "Container connection failed" }
  }
}

const fetchPostgresDatabases = async (data: { type: "postgres" | "postgres-container"; host?: string; port?: number; user: string; password: string; containerName?: string; database?: string }): Promise<{ success: boolean; databases?: string[]; message?: string }> => {
  const { type, host, port, user, password, containerName, database } = data
  if (type === "postgres") {
    if (!host) return { success: false, message: "Host is required" }
    try {
      const dbFlag = database ? `-d ${database}` : `-d template1`
      const cmd = `PGPASSWORD=${password} psql -h ${host} -p ${port ?? 5432} -U ${user} ${dbFlag} -t -A -c "SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname;"`
      const result = await $`bash -c ${cmd}`.quiet().text()
      const databases = result.trim().split("\n").filter(Boolean).map((d) => d.trim())
      return { success: true, databases }
    } catch (err: unknown) {
      return { success: false, message: err instanceof Error ? err.message : "Failed to fetch databases" }
    }
  }
  if (!containerName) return { success: false, message: "Container name is required" }
  try {
    const dbFlag = database ? `-d ${database}` : `-d template1`
    const result = await $`docker exec ${containerName} psql -U ${user} ${dbFlag} -t -A -c "SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname;"`.quiet().text()
    const databases = result.trim().split("\n").filter(Boolean).map((d) => d.trim())
    return { success: true, databases }
  } catch (err: unknown) {
    return { success: false, message: err instanceof Error ? err.message : "Failed to fetch databases" }
  }
}

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

sources.post("/test", async (c) => {
  const result = await validateBody(PostgresTestSchema, c)
  if (!result.ok) return result.error
  const res = await testPostgresConnection(result.data)
  return c.json({ success: res.success, data: res })
})

sources.post("/databases", async (c) => {
  const result = await validateBody(PostgresDatabasesSchema, c)
  if (!result.ok) return result.error
  const res = await fetchPostgresDatabases(result.data)
  return c.json({ success: res.success, data: res.databases })
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
  return c.json({ success: true, message: "Source deleted" })
})

export { sources }
