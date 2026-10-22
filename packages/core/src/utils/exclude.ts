import { Glob } from "bun"
import { existsSync, statSync } from "node:fs"
import type { PathMatcher, SourceFileSummary } from "../types/exclude"
import { logger } from "./logger"

const WILDCARD_CHARS = /[*?[\]{}]/

const basenameOf = (filePath: string): string => filePath.slice(filePath.lastIndexOf("/") + 1)

const segmentsOf = (filePath: string): string[] => filePath.split("/")

const buildMatcher = (pattern: string): PathMatcher | null => {
  const trimmed = pattern.trim()
  if (!trimmed) return null

  let glob: Glob | null = null
  try {
    glob = new Glob(trimmed)
  } catch (err) {
    logger.warn({ pattern: trimmed, err }, "invalid exclude pattern, matching literally")
  }

  const bare = !trimmed.includes("/")
  const literal = WILDCARD_CHARS.test(trimmed) ? null : trimmed.replace(/\/+$/, "")
  const lastSegment = trimmed.split("/").pop() ?? ""
  const segmentName = WILDCARD_CHARS.test(lastSegment) ? null : lastSegment
  const matchBySegment = segmentName !== null && (bare || trimmed.includes("**"))

  return (filePath: string): boolean => {
    if (glob?.match(filePath)) return true
    if (bare && glob?.match(basenameOf(filePath))) return true
    if (matchBySegment && segmentsOf(filePath).includes(segmentName)) return true
    if (literal && (filePath === literal || filePath.startsWith(`${literal}/`))) return true
    return false
  }
}

const createExcludeFilter = (patterns: string[]): PathMatcher => {
  const matchers = patterns.map(buildMatcher).filter((matcher): matcher is PathMatcher => matcher !== null)
  if (!matchers.length) return () => false
  return (filePath: string): boolean => matchers.some((matcher) => matcher(filePath))
}

const isFile = (filePath: string): boolean => {
  try {
    return statSync(filePath).isFile()
  } catch {
    return false
  }
}

const listFilesRecursive = (dirPath: string): string[] =>
  [...new Glob(`${dirPath}/**/*`).scanSync({ absolute: true })].filter((file) => existsSync(file) && isFile(file))

const collectSourceFiles = (sourcePath: string): string[] => {
  if (existsSync(sourcePath)) {
    if (isFile(sourcePath)) return [sourcePath]
    if (statSync(sourcePath).isDirectory()) return listFilesRecursive(sourcePath)
  }

  return [...new Glob(sourcePath).scanSync({ absolute: true })].filter((file) => existsSync(file) && isFile(file))
}

const summarizeSourceFiles = (sourcePath: string, patterns: string[]): SourceFileSummary => {
  const files = collectSourceFiles(sourcePath)
  const isExcluded = createExcludeFilter(patterns)

  return { total: files.length, excluded: files.filter((file) => isExcluded(file)).length }
}

export { createExcludeFilter, summarizeSourceFiles }
