import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { Source } from "@chest-backup/shared"
import type { SourceMutationData } from "@/types/mutations"
import { fetchSources, fetchSource, createSource, updateSource, deleteSource } from "@/lib/api-client"

const useSources = () => useQuery<Source[]>({ queryKey: ["sources"], queryFn: fetchSources })

const useSource = (id: string) =>
  useQuery<Source>({ queryKey: ["sources", id], queryFn: () => fetchSource(id), enabled: !!id })

const useCreateSource = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data: Record<string, unknown>) => createSource(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["sources"] })
    },
  })
}

const useUpdateSource = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: SourceMutationData) => updateSource(id, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["sources"] })
    },
  })
}

const useDeleteSource = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteSource(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["sources"] })
    },
  })
}

export { useSources, useSource, useCreateSource, useUpdateSource, useDeleteSource }
