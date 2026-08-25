import { useQuery } from "@tanstack/react-query"
import { fetchSystem } from "@/lib/api-client"

const useSystem = () => useQuery({ queryKey: ["system"], queryFn: fetchSystem })

export { useSystem }
