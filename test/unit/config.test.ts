import { describe, expect, test } from "bun:test"
import { ConfigSchema } from "../../src/config/schema"

describe("ConfigSchema", () => {
  test("valid minimal config passes", () => {
    const result = ConfigSchema.safeParse({
      sources: [{ type: "path", path: "/data" }],
      destinations: [{ type: "local", path: "/backups" }],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.retention).toBe(7)
      expect(result.data.destinations[0]?.parallel).toBe(true)
    }
  })

  test("valid full config passes", () => {
    const result = ConfigSchema.safeParse({
      schedule: "0 3 * * *",
      retention: 14,
      sources: [
        { type: "path", path: "/data/docs" },
        { type: "path", path: "/data/config.yaml" },
        { type: "postgres", host: "localhost", port: 5432, user: "user", password: "pass", database: "testdb" },
        { type: "docker-compose", name: "my-app", path: "/data/volumes", containers: ["app_db", "app_web"] },
        { type: "postgres-container", containerName: "my_db", user: "postgres", password: "secret", database: "myapp" },
      ],
      destinations: [
        { type: "local", path: "/backups/local", retention: 30, parallel: false },
        { type: "sftp", host: "sftp.example.com", user: "user", password: "pass", path: "/remote", parallel: true },
      ],
      notifications: { discord: { webhookUrl: "https://discord.com/api/webhooks/123/abc" } },
    })
    expect(result.success).toBe(true)
  })

  test("rejects config without sources", () => {
    const result = ConfigSchema.safeParse({
      destinations: [{ type: "local", path: "/backups" }],
    })
    expect(result.success).toBe(false)
  })

  test("rejects config without destinations", () => {
    const result = ConfigSchema.safeParse({
      sources: [{ type: "path", path: "/data" }],
    })
    expect(result.success).toBe(false)
  })

  test("rejects invalid source path", () => {
    const result = ConfigSchema.safeParse({
      sources: [{ type: "path", path: "" }],
      destinations: [{ type: "local", path: "/backups" }],
    })
    expect(result.success).toBe(false)
  })

  test("rejects invalid destination type", () => {
    const result = ConfigSchema.safeParse({
      sources: [{ type: "path", path: "/data" }],
      destinations: [{ type: "s3", path: "/backups" }],
    })
    expect(result.success).toBe(false)
  })

  test("applies default retention and parallel", () => {
    const result = ConfigSchema.safeParse({
      sources: [{ type: "path", path: "/data" }],
      destinations: [{ type: "local", path: "/backups" }],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.retention).toBe(7)
      expect(result.data.destinations[0]?.parallel).toBe(true)
    }
  })
})
