import { execSync } from "node:child_process"
import { expect, test, type Page } from "@playwright/test"

const dockerExec = (container: string, cmd: string): string =>
  execSync(`docker exec ${container} ${cmd}`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim()

const selectType = async (page: Page, value: string): Promise<void> => {
  const firstSelect = page.locator("select").first()
  await firstSelect.selectOption(value)
}

const addSource = async (page: Page, fill: (page: Page) => Promise<void>): Promise<void> => {
  await page.goto("/sources/new")
  await fill(page)
  await page.getByRole("button", { name: "Create" }).click()
  await page.waitForSelector('text=Manage backup sources', { timeout: 60_000 })
}

const addDestination = async (page: Page, fill: (page: Page) => Promise<void>): Promise<void> => {
  await page.goto("/destinations/new")
  await fill(page)
  await page.getByRole("button", { name: "Create" }).click()
  await page.waitForSelector('text=Manage backup destinations', { timeout: 60_000 })
}

test.describe("full UI round-trip: sources + destinations -> backup -> restore", () => {
  test("add every source type via the UI", async ({ page }) => {
    await addSource(page, async (p) => {
      await p.locator("#path").fill("/etc/hostname")
    })

    await addSource(page, async (p) => {
      await selectType(p, "postgres")
      await p.locator("#host").fill("postgres")
      await p.locator("#port").fill("5432")
      await p.locator("#user").fill("chest")
      await p.locator("#password").fill("chest")
      await expect(p.locator('#database option[value="chestdb"]')).toHaveCount(1, { timeout: 60_000 })
      await p.locator("#database").selectOption("chestdb")
    })

    await addSource(page, async (p) => {
      await selectType(p, "sqlite-container")
      await expect(p.locator('#containerName option[value="chest-e2eui-sqldb"]')).toHaveCount(1, { timeout: 60_000 })
      await p.locator("#containerName").selectOption("chest-e2eui-sqldb")
      await p.locator("#dbPath").fill("/data/app.db")
    })

    await addSource(page, async (p) => {
      await selectType(p, "container-volume")
      await expect(p.locator('#cvContainerName option[value="chest-e2eui-appvol"]')).toHaveCount(1, { timeout: 60_000 })
      await p.locator("#cvContainerName").selectOption("chest-e2eui-appvol")
      await expect(p.locator("#volumePath option").nth(1)).toHaveCount(1, { timeout: 60_000 })
      await p.locator("#volumePath").selectOption({ index: 1 })
    })

    await page.goto("/sources")
    for (const name of ["File Path", "PostgreSQL", "SQLite Container", "Container Volume"]) {
      await expect(page.getByText(name).first()).toBeVisible()
    }
  })

  test("add local and sftp destinations via the UI", async ({ page }) => {
    await addDestination(page, async (p) => {
      await p.locator("#name").fill("Local")
      await p.locator("#path").fill("/backups/local")
    })

    await addDestination(page, async (p) => {
      await selectType(p, "sftp")
      await p.locator("#name").fill("SFTP")
      await p.locator("#path").fill("/backups/sftp")
      const group = (label: string): ReturnType<Page["locator"]> => p.locator(`css=div >> text="${label}"`).locator("..").locator("input")
      await group("SFTP Host").fill("sftp")
      await group("SFTP Port").fill("22")
      await group("SFTP User").fill("chest")
      await group("SFTP Password").fill("chest")
    })

    await page.goto("/destinations")
    await expect(page.getByText("Local").first()).toBeVisible()
    await expect(page.getByText("SFTP").first()).toBeVisible()
  })

  test("trigger a backup from the UI and wait for it to complete", async ({ page }) => {
    await page.goto("/activity")
    await page.locator("main").getByRole("button", { name: "Run Backup Now" }).click()
    await expect(page.getByText("Backup Complete")).toBeVisible({ timeout: 180_000 })
  })

  test("backup landed real data on both destinations", async () => {
    const waitForFiles = async (container: string, path: string): Promise<number> => {
      for (let i = 0; i < 30; i++) {
        const count = Number(dockerExec(container, `find ${path} -type f | wc -l`))
        if (count >= 2) return count
        await new Promise((resolve) => setTimeout(resolve, 1_000))
      }
      return Number(dockerExec(container, `find ${path} -type f | wc -l`))
    }

    const localFiles = await waitForFiles("chest-e2eui-app", "/backups/local")
    expect(localFiles).toBeGreaterThanOrEqual(2)

    const sftpCount = await waitForFiles("chest-e2eui-sftp", "/backups/sftp")
    expect(sftpCount).toBeGreaterThanOrEqual(2)

    const sqliteDump = dockerExec("chest-e2eui-app", "find /backups/local -name '*sqldb*.db' | head -1")
    expect(sqliteDump).not.toBe("")
  })

  test("trigger a restore from the UI into a fresh path", async ({ page }) => {
    await page.goto("/restore")
    await expect(page.locator('#restore-dest option').nth(1)).toHaveCount(1, { timeout: 60_000 })
    await page.locator("#restore-dest").selectOption({ index: 1 })
    await expect(page.locator('#restore-snapshot option:not([value=""])')).toHaveCount(1, { timeout: 60_000 })
    const snapshotValue = (await page.locator('#restore-snapshot option:not([value=""])').getAttribute("value")) ?? ""
    await page.locator("#restore-snapshot").selectOption(snapshotValue)

    await page.getByPlaceholder("Search files…").fill("hostname")
    await page.locator('input[type="checkbox"]').last().check()

    await page.locator("#restore-target").fill("/restored")
    await page.getByRole("button", { name: /^Restore/ }).first().click()
    await page.getByRole("dialog").getByRole("button", { name: "Restore" }).click()
    await expect(page.getByText("Success")).toBeVisible({ timeout: 180_000 })
  })

  test("restored data is present on disk in the app container", () => {
    const restored = dockerExec("chest-e2eui-app", "find /restored -type f | wc -l")
    expect(Number(restored)).toBeGreaterThan(0)
  })
})
