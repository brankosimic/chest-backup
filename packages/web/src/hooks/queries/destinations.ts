import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { Destination } from "@chest-backup/shared"
import type { SourceMutationData } from "@/types/mutations"
import type { DestinationUsage } from "@/types/backup"
import {
  fetchDestinations,
  fetchDestination,
  fetchDestinationUsage,
  createDestination,
  updateDestination,
  deleteDestination,
} from "@/lib/api-client"

const useDestinations = () =>
  useQuery<Destination[]>({ queryKey: ["destinations"], queryFn: fetchDestinations })

const useDestinationUsage = (id: string) =>
  useQuery<DestinationUsage>({
    queryKey: ["destination-usage", id],
    queryFn: () => fetchDestinationUsage(id),
    enabled: !!id,
  })

const useDestination = (id: string) =>
  useQuery<Destination>({ queryKey: ["destinations", id], queryFn: () => fetchDestination(id), enabled: !!id })

const useCreateDestination = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (data: Record<string, unknown>) => createDestination(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["destinations"] })
    },
  })
}

const useUpdateDestination = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: SourceMutationData) => updateDestination(id, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["destinations"] })
    },
  })
}

const useDeleteDestination = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteDestination(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["destinations"] })
    },
  })
}

export {
  useDestinations,
  useDestinationUsage,
  useDestination,
  useCreateDestination,
  useUpdateDestination,
  useDeleteDestination,
}
