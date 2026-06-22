import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import type { Config } from "../types/config"
import { ConfigSchema } from "./schema"

function resolveEnvVars(value: unknown): unknown {
  if (typeof value === "string") {
    return value.replace(/\$\{(\w+)\}/g, (_match, name) => {
      if (!(name in process.env)) {
        throw new Error(`Environment variable "${name}" is not set (referenced in config)`)
      }
      return process.env[name]!
    })
  }
  if (Array.isArray(value)) {
    return value.map(resolveEnvVars)
  }
  if (value !== null && typeof value === "object") {
    const obj: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      obj[k] = resolveEnvVars(v)
    }
    return obj
  }
  return value
}

function loadConfig(path?: string): Config {
  const configPath = resolve(path ?? "./chest-backup.json")
  const raw = readFileSync(configPath, "utf-8")
  const parsed: unknown = resolveEnvVars(JSON.parse(raw))
  const result = ConfigSchema.safeParse(parsed)

  if (!result.success) {
    const issues = result.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n")
    throw new Error(`Config validation failed:\n${issues}`)
  }

  return result.data as Config
}

export { loadConfig }
