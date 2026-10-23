import type { BackupRecord } from "@chest-backup/shared"

const CSV_HEADER = [
  "runId",
  "startedAt",
  "status",
  "trigger",
  "durationMs",
  "filesBackedUp",
  "filesChanged",
  "totalUploadedBytes",
  "destinations",
  "errors",
]

const csvCell = (value: string | number | undefined): string => {
  const text = value === undefined ? "" : String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

const destinationSummary = (run: BackupRecord): string =>
  run.destinationResults
    .map((result) => {
      const name = result.destName ?? result.destPath ?? "?"
      const outcome = result.skipped ? "skipped" : result.success ? "ok" : "error"
      return `${name}:${outcome}`
    })
    .join(" | ")

const runToRow = (run: BackupRecord): string =>
  [
    run.runId,
    run.startedAt,
    run.status,
    run.trigger,
    run.durationMs,
    run.filesBackedUp ?? 0,
    run.filesChanged ?? 0,
    run.totalUploadedBytes ?? 0,
    destinationSummary(run),
    run.errors.join(" | "),
  ]
    .map(csvCell)
    .join(",")

const runsToCsv = (runs: BackupRecord[]): string =>
  [CSV_HEADER.join(","), ...runs.map(runToRow)].join("\n")

const downloadCsv = (runs: BackupRecord[]): void => {
  const blob = new Blob([runsToCsv(runs)], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `chest-backup-runs-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export { downloadCsv, runsToCsv }
