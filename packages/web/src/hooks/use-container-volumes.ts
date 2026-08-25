import { useState, useEffect, useCallback, useRef } from "react"
import { useTranslation } from "react-i18next"
import { fetchContainerVolumes } from "@/lib/api-client"
import { SourceType } from "@/lib/sources"
import type { ContainerVolume } from "@/types/backup"

const useContainerVolumes = (props: { containerName: string; type: string }) => {
  const { t } = useTranslation()
  const [volumes, setVolumes] = useState<ContainerVolume[]>([])
  const [error, setError] = useState("")
  const cvFetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchVolumes = useCallback(async () => {
    if (!props.containerName) return
    setError("")
    try {
      const res = await fetchContainerVolumes(props.containerName)
      setVolumes(res)
      if (!res.length) setError(t("sources.noVolumes"))
    } catch {
      setError(t("sources.fetchVolumesError"))
    }
  }, [props.containerName, t])

  useEffect(() => {
    if (cvFetchTimerRef.current) clearTimeout(cvFetchTimerRef.current)
    if (props.type !== SourceType.ContainerVolume || !props.containerName) return
    cvFetchTimerRef.current = setTimeout(() => {
      void fetchVolumes()
    }, 300)
    return () => {
      if (cvFetchTimerRef.current) clearTimeout(cvFetchTimerRef.current)
    }
  }, [fetchVolumes, props.type, props.containerName])

  useEffect(() => {
    if (props.type !== SourceType.ContainerVolume || !props.containerName) {
      setVolumes([])
      setError("")
    }
  }, [props.type, props.containerName])

  return { volumes, error }
}

export { useContainerVolumes }
