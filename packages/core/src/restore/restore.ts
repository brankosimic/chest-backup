import { copyFile, chmod, lstat, mkdir, stat, utimes } from "node:fs/promises"
import { dirname, join, resolve, sep } from "node:path"
import SFTPClient from "ssh2-sftp-client"
import {
  DestinationType,
  RestorePhase,
  RestoreFileStatus,
  type RestoreFileResult,
  type RestoreOptions,
  type RestoreProgressEvent,
  type RestoreResult,
  type RestoreSnapshotFile,
} from "@chest-backup/shared"
import type { Destination } from "../types/config"
import type { RestoreContext, FileOutcome, RestoreCounters, ProgressTotals, RestoreProgressCallback, RestoreRunArgs, ProcessFilesArgs, FileSelection, RestoreHandlerArgs } from "../types/restore"
import { connectClient } from "../destinations/sftp"
import { normalizeBase } from "../utils/mirror"
import { logger } from "../utils/logger"
import { listSnapshotFiles } from "./snapshots"
const normalizeRelative = (path: string): string => path.replace(/\\/g, "/").replace(/^\/+/, "")
const isSafeRelative = (path: string): boolean =>
  path.length > 0 &&
  path
    .split("/")
    .every((segment) => segment.length > 0 && segment !== "." && segment !== "..")
const targetPathFor = (root: string, relative: string): string => {
  if (!isSafeRelative(relative)) throw new Error(`Unsafe snapshot path: ${relative}`)
  const target = resolve(root, ...relative.split("/"))
  if (target !== root && !target.startsWith(`${root}${sep}`)) throw new Error(`Path escapes restore root: ${relative}`)
  return target
}
const assertTargetWritable = async (target: string, overwrite: boolean): Promise<void> => {
  let existing
  try {
    existing = await lstat(target)
  } catch {
    return
  }
  if (existing.isDirectory()) throw new Error("target is a directory")
  if (existing.isSymbolicLink() && !(await stat(target).catch(() => null))) throw new Error("target is a broken symlink")
  if (!overwrite) throw new Error("target exists")
}
const preserveMetadata = async (source: string, target: string): Promise<void> => {
  try {
    const sourceStat = await stat(source)
    await chmod(target, sourceStat.mode)
    await utimes(target, sourceStat.atime, sourceStat.mtime)
  } catch (err) {
    logger.debug({ source, err }, "failed to preserve file metadata after restore")
  }
}
const skippedOutcome = (path: string, target: string, size: number): FileOutcome => ({
  result: { path, target, size, status: RestoreFileStatus.Skipped },
  bytes: 0,
})
const restoredOutcome = (path: string, target: string, size: number): FileOutcome => ({
  result: { path, target, size, status: RestoreFileStatus.Restored },
  bytes: size,
})
const isSkipped = async (target: string, overwrite: boolean): Promise<boolean> => {
  try {
    await assertTargetWritable(target, overwrite)
    return false
  } catch {
    return true
  }
}
const dryRunOutcome = async (file: RestoreSnapshotFile, context: RestoreContext): Promise<FileOutcome> => {
  const target = targetPathFor(context.targetRoot, file.path)
  return (await isSkipped(target, context.overwrite)) ? skippedOutcome(file.path, target, file.size) : restoredOutcome(file.path, target, file.size)
}
const copyLocalFile = async (sourceRoot: string, file: RestoreSnapshotFile, context: RestoreContext): Promise<FileOutcome> => {
  const source = join(sourceRoot, file.path)
  const target = targetPathFor(context.targetRoot, file.path)
  if (await isSkipped(target, context.overwrite)) return skippedOutcome(file.path, target, file.size)
  await mkdir(dirname(target), { recursive: true })
  await copyFile(source, target)
  await preserveMetadata(source, target)
  return restoredOutcome(file.path, target, file.size)
}
const restoreLocalFile = async (sourceRoot: string, file: RestoreSnapshotFile, context: RestoreContext): Promise<FileOutcome> =>
  (context.dryRun ? dryRunOutcome(file, context) : copyLocalFile(sourceRoot, file, context))
const fetchSftpFile = async (sftp: SFTPClient, sourceRoot: string, file: RestoreSnapshotFile, context: RestoreContext): Promise<FileOutcome> => {
  const target = targetPathFor(context.targetRoot, file.path)
  if (await isSkipped(target, context.overwrite)) return skippedOutcome(file.path, target, file.size)
  await mkdir(dirname(target), { recursive: true })
  await sftp.fastGet(`${sourceRoot}/${file.path}`, target, { concurrency: 64, chunkSize: 262_144 })
  return restoredOutcome(file.path, target, file.size)
}
const restoreSftpFile = async (sftp: SFTPClient, sourceRoot: string, file: RestoreSnapshotFile, context: RestoreContext): Promise<FileOutcome> =>
  (context.dryRun ? dryRunOutcome(file, context) : fetchSftpFile(sftp, sourceRoot, file, context))
const selectFiles = (available: RestoreSnapshotFile[], requested: string[] | undefined): FileSelection => {
  if (!requested) return { selected: available, missing: [] }
  const wanted = new Set(requested.map(normalizeRelative))
  const selected = available.filter((file) => wanted.has(file.path))
  const found = new Set(selected.map((file) => file.path))
  return { selected, missing: [...wanted].filter((path) => !found.has(path)) }
}
const toFailure = (path: string, targetRoot: string, error: string): RestoreFileResult => ({
  path,
  target: isSafeRelative(path) ? targetPathFor(targetRoot, path) : path,
  size: 0,
  status: RestoreFileStatus.Failed,
  error,
})
const runFile = async (file: RestoreSnapshotFile, context: RestoreContext, restore: () => Promise<FileOutcome>): Promise<FileOutcome> => {
  try {
    return await restore()
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logger.error({ path: file.path, err }, "restore failed for file")
    return failureOutcome(file, context.targetRoot, message)
  }
}
const failureOutcome = (file: RestoreSnapshotFile, targetRoot: string, error: string): FileOutcome => ({
  result: { ...toFailure(file.path, targetRoot, error), size: file.size },
  bytes: 0,
})
const emitProgress = (onProgress: RestoreProgressCallback | undefined, event: Omit<RestoreProgressEvent, "phase">): void => {
  onProgress?.({ ...event, phase: RestorePhase.Restoring })
}
const progressTotals = (files: RestoreSnapshotFile[], missing: string[]): ProgressTotals => ({
  totalFiles: files.length + missing.length,
  totalBytes: files.reduce((acc, file) => acc + file.size, 0),
  missingErrors: missing.map((path) => `File not present in snapshot: ${path}`),
})
const tallyOutcome = (counts: RestoreCounters, outcome: FileOutcome): void => {
  if (outcome.result.status === RestoreFileStatus.Restored) counts.restored += 1
  if (outcome.result.status === RestoreFileStatus.Skipped) counts.skipped += 1
  if (outcome.result.status === RestoreFileStatus.Failed) counts.failed += 1
  counts.bytes += outcome.bytes
}
const emitFileProgress = (onProgress: RestoreProgressCallback | undefined, totals: ProgressTotals, counts: RestoreCounters, file: RestoreSnapshotFile): void => {
  emitProgress(onProgress, { totalFiles: totals.totalFiles, completedFiles: counts.completed, restoredCount: counts.restored, skippedCount: counts.skipped, failedCount: counts.failed, restoredBytes: counts.bytes, currentPath: file.path })
}
const missingResults = (missing: string[], targetRoot: string): RestoreFileResult[] =>
  missing.map((path) => toFailure(path, targetRoot, "File not present in snapshot"))
const freshCounters = (missingCount: number): RestoreCounters => ({ completed: missingCount, restored: 0, skipped: 0, failed: missingCount, bytes: 0 })
const failedErrorsOf = (results: RestoreFileResult[]): string[] =>
  results.filter((result) => result.status === RestoreFileStatus.Failed && result.error).map((result) => `${result.path}: ${result.error ?? "unknown error"}`)
const processOneFile = async (args: ProcessFilesArgs, file: RestoreSnapshotFile): Promise<void> => {
  const outcome = await runFile(file, args.context, () => args.handler(file))
  args.results.push(outcome.result)
  args.counts.completed += 1
  tallyOutcome(args.counts, outcome)
  emitFileProgress(args.onProgress, args.totals, args.counts, file)
}
const processFiles = async (args: ProcessFilesArgs): Promise<void> => {
  for (const file of args.files) await processOneFile(args, file)
}
const buildResult = (results: RestoreFileResult[], totals: ProgressTotals, counts: RestoreCounters, startedAt: number): RestoreResult => ({
  success: counts.failed === 0, files: results, restoredCount: counts.restored, skippedCount: counts.skipped, failedCount: counts.failed,
  totalFiles: totals.totalFiles, totalBytes: totals.totalBytes, restoredBytes: counts.bytes, durationMs: Date.now() - startedAt,
  errors: [...totals.missingErrors, ...failedErrorsOf(results)],
})
const restoreWithHandler = async (args: RestoreHandlerArgs): Promise<RestoreResult> => {
  const startedAt = Date.now()
  const processArgs: ProcessFilesArgs = { ...args, totals: progressTotals(args.files, args.missing), counts: freshCounters(args.missing.length), results: missingResults(args.missing, args.context.targetRoot) }
  await processFiles(processArgs)
  const result = buildResult(processArgs.results, processArgs.totals, processArgs.counts, startedAt)
  logger.info({ restored: processArgs.counts.restored, skipped: processArgs.counts.skipped, failed: processArgs.counts.failed, totalFiles: processArgs.totals.totalFiles, restoredBytes: processArgs.counts.bytes, durationMs: result.durationMs }, "snapshot restore finished")
  return result
}
const restoreLocal = (args: RestoreRunArgs): Promise<RestoreResult> => restoreWithHandler({ ...args, handler: (file) => restoreLocalFile(join(normalizeBase(args.dest.path), args.periodKey), file, args.context) })
const closeSftp = async (sftp: SFTPClient): Promise<void> => {
  await sftp.end().catch((err: unknown) => {
    logger.warn({ err }, "failed to close SFTP connection after restore")
  })
}
const restoreSftp = async (args: RestoreRunArgs): Promise<RestoreResult> => {
  if (!args.dest.host || !args.dest.user) throw new Error("SFTP destination missing host or user")
  const sftp = new SFTPClient()
  try {
    await connectClient(sftp, args.dest)
    return await restoreWithHandler({ ...args, handler: (file) => restoreSftpFile(sftp, `${normalizeBase(args.dest.path)}/${args.periodKey}`, file, args.context) })
  } finally {
    await closeSftp(sftp)
  }
}
const createContext = (options: RestoreOptions): RestoreContext => ({
  targetRoot: resolve(options.targetRoot?.trim() || "/"),
  overwrite: options.overwrite ?? true,
  dryRun: options.dryRun ?? false,
})
const restoreSnapshot = async (dest: Destination, periodKey: string, options: RestoreOptions = {}, onProgress?: RestoreProgressCallback): Promise<RestoreResult> => {
  const selection = selectFiles(await listSnapshotFiles(dest, periodKey), options.files)
  const args: RestoreRunArgs = { dest, periodKey, files: selection.selected, missing: selection.missing, context: createContext(options), onProgress }
  logger.info({ destination: dest.name ?? dest.path, period: periodKey, files: args.files.length, missing: args.missing.length, targetRoot: args.context.targetRoot, overwrite: args.context.overwrite, dryRun: args.context.dryRun }, "snapshot restore started")
  emitProgress(args.onProgress, { totalFiles: args.files.length + args.missing.length, completedFiles: 0, restoredCount: 0, skippedCount: 0, failedCount: 0, restoredBytes: 0 })
  return dest.type === DestinationType.Local ? restoreLocal(args) : restoreSftp(args)
}
export { restoreSnapshot, targetPathFor }
