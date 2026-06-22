import { describe, expect, test } from "bun:test"
import { parseTimestampFromName, ARCHIVE_PATTERN } from "../../src/backup/retention"

describe("retention", () => {
  test("ARCHIVE_PATTERN matches valid filenames", () => {
    expect(ARCHIVE_PATTERN.test("chest-backup-20240101-120000.tar.gz")).toBe(true)
    expect(ARCHIVE_PATTERN.test("chest-backup-20241231-235959.tar.gz")).toBe(true)
  })

  test("ARCHIVE_PATTERN rejects invalid filenames", () => {
    expect(ARCHIVE_PATTERN.test("backup-20240101-120000.tar.gz")).toBe(false)
    expect(ARCHIVE_PATTERN.test("chest-backup-20240101.tar.gz")).toBe(false)
    expect(ARCHIVE_PATTERN.test("chest-backup-20240101-120000.zip")).toBe(false)
    expect(ARCHIVE_PATTERN.test("random-file.txt")).toBe(false)
  })

  test("parseTimestampFromName extracts timestamp", () => {
    expect(parseTimestampFromName("chest-backup-20240101-120000.tar.gz")).toBe("20240101-120000")
    expect(parseTimestampFromName("chest-backup-20241231-235959.tar.gz")).toBe("20241231-235959")
  })

  test("parseTimestampFromName returns null for invalid names", () => {
    expect(parseTimestampFromName("invalid.tar.gz")).toBe(null)
    expect(parseTimestampFromName("backup-20240101-120000.tar.gz")).toBe(null)
  })
})
