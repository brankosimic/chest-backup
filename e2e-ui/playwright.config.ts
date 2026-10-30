import { execSync } from "node:child_process"
import { defineConfig } from "@playwright/test"

const APP_PORT = Number(process.env.APP_PORT ?? 5199)

const resolveAppUrl = (): string => {
  const ip = execSync("getent hosts app | awk '{print $1}'", { encoding: "utf8" }).trim()
  return `http://${ip}:${APP_PORT}`
}

export default defineConfig({
  testDir: "./tests",
  timeout: 300_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  outputDir: "test-results",
  use: {
    baseURL: process.env.APP_URL ?? resolveAppUrl(),
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
})
