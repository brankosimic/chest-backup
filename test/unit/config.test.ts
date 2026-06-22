import { describe, expect, test } from "bun:test"
import { ConfigSchema } from "../../src/config/schema"

describe("ConfigSchema", () => {
  test("valid minimal config passes", () => {
    const result = ConfigSchema.safeParse({
      sources: [{ path: "/data" }],
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
      sources: [{ path: "/data/docs" }, { path: "/data/config.yaml" }],
      destinations: [
        { type: "local", path: "/backups/local", retention: 30, parallel: false },
        { type: "ftp", host: "ftp.example.com", user: "user", password: "pass", path: "/remote", parallel: true },
      ],
      databases: [
        { type: "host", connectionString: "postgresql://user:pass@host/db", database: "testdb" },
        { type: "docker", containerName: "pg", database: "testdb", username: "user", password: "pass" },
      ],
      containers: ["my-app"],
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
      sources: [{ path: "/data" }],
    })
    expect(result.success).toBe(false)
  })

  test("rejects invalid source path", () => {
    const result = ConfigSchema.safeParse({
      sources: [{ path: "" }],
      destinations: [{ type: "local", path: "/backups" }],
    })
    expect(result.success).toBe(false)
  })

  test("rejects invalid destination type", () => {
    const result = ConfigSchema.safeParse({
      sources: [{ path: "/data" }],
      destinations: [{ type: "s3", path: "/backups" }],
    })
    expect(result.success).toBe(false)
  })

  test("applies default retention and parallel", () => {
    const result = ConfigSchema.safeParse({
      sources: [{ path: "/data" }],
      destinations: [{ type: "local", path: "/backups" }],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.retention).toBe(7)
      expect(result.data.destinations[0]?.parallel).toBe(true)
    }
  })
})
