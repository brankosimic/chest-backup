import type { QueryClient } from "@tanstack/react-query"

const RUN_QUERY_KEYS = [["backups"], ["backup-stats"], ["logs"], ["schedule"]]

const invalidateRunQueries = (client: QueryClient): void => {
  RUN_QUERY_KEYS.forEach((queryKey) => {
    void client.invalidateQueries({ queryKey })
  })
}

export { invalidateRunQueries }
