import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { RestoreStatus } from "@chest-backup/shared"
import {
  fetchRestoreSnapshots,
  fetchRestoreSnapshotFiles,
  startRestore,
  fetchRestoreJob,
  fetchActiveRestore,
} from "@/lib/api-client"

const useRestoreSnapshots = (destinationId: string | null) =>
  useQuery({
    queryKey: ["restore-snapshots", destinationId],
    queryFn: () => fetchRestoreSnapshots(destinationId ?? ""),
    enabled: !!destinationId,
  })

const useRestoreSnapshotFiles = (destinationId: string | null, periodKey: string | null) =>
  useQuery({
    queryKey: ["restore-snapshot-files", destinationId, periodKey],
    queryFn: () => fetchRestoreSnapshotFiles(destinationId ?? "", periodKey ?? ""),
    enabled: !!destinationId && !!periodKey,
  })

const useStartRestore = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: startRestore,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["restore-active"] })
    },
  })
}

const useRestoreJob = (id: string | null) =>
  useQuery({
    queryKey: ["restore-job", id],
    queryFn: () => fetchRestoreJob(id ?? ""),
    enabled: !!id,
    refetchInterval: (query) => {
      const job = query.state.data
      return job && job.status === RestoreStatus.Running ? 1_000 : false
    },
  })

const useActiveRestore = () =>
  useQuery({
    queryKey: ["restore-active"],
    queryFn: fetchActiveRestore,
    refetchInterval: (query) => {
      const job = query.state.data
      return job && job.status === RestoreStatus.Running ? 3_000 : false
    },
  })

export { useRestoreSnapshots, useRestoreSnapshotFiles, useStartRestore, useRestoreJob, useActiveRestore }
