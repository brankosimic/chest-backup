import { existsSync, readdirSync, statSync, type Stats } from "node:fs"
import { resolve } from "node:path"
import type { BackupRecord } from "@chest-backup/shared"
import { DestinationType, RunTrigger } from "@chest-backup/shared"
import { getConfig, stableId } from "./config"
import type { DestinationRef } from "../../types/api"

const archiveFiles = (dir: string): string[] =>
  readdirSync(dir).filter((f) => f.endsWith(".tar.gz") && !f.endsWith(".sha256")).sort().reverse()

const archiveStamp = (file: string, st: Stats): string => {
  const match = file.match(/chest-backup-(\d{8})-(\d{6})/)
  return match ? `${match[1].slice(0, 4)}-${match[1].slice(4, 6)}-${match[1].slice(6, 8)}T${match[2].slice(0, 2)}:${match[2].slice(2, 4)}:${match[2].slice(4, 6)}.000Z` : new Date(st.mtimeMs).toISOString()
}

const seedDestinationResult = (localDest: DestinationRef, shaExists: boolean): BackupRecord["destinationResults"][number] => ({
  success: shaExists, destId: localDest.id, destName: localDest.name, destPath: localDest.path, destType: DestinationType.Local,
  destLabel: localDest.path, durationMs: 0, uploaded: [], deleted: [], uploadedCount: 0, deletedCount: 0,
})

const seedRecordFromArchive = (file: string, dir: string, localDest: DestinationRef, normalizeRecord: (raw: Partial<BackupRecord> & { id?: string }) => BackupRecord, localStampToIso: (stamp: string) => string): BackupRecord => {
  const st = statSync(resolve(dir, file))
  const shaExists = existsSync(resolve(dir, `${file}.sha256`))
  const stamp = archiveStamp(file, st)

  return normalizeRecord({
    id: stableId({ file, timestamp: st.mtimeMs }),
    timestamp: stamp,
    startedAt: localStampToIso(stamp),
    finishedAt: localStampToIso(stamp),
    success: shaExists,
    trigger: RunTrigger.Scheduled,
    archiveName: file,
    archiveSize: st.size,
    durationMs: 0,
    destinationResults: [seedDestinationResult(localDest, shaExists)],
    errors: shaExists ? [] : ["Missing SHA256 checksum file"],
  })
}

const seedFromArchiveDir = (normalizeRecord: (raw: Partial<BackupRecord> & { id?: string }) => BackupRecord, localStampToIso: (stamp: string) => string): BackupRecord[] => {
  const localDest = getConfig().config.destinations.find((d) => d.type === DestinationType.Local)
  if (!localDest?.path || !existsSync(localDest.path)) return []
  return archiveFiles(localDest.path).map((file) => seedRecordFromArchive(file, localDest.path, localDest, normalizeRecord, localStampToIso))
}

export { seedFromArchiveDir }
