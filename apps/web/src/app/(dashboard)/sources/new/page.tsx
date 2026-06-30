"use client"

import { useTranslation } from "react-i18next"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Header } from "@/components/layout/header"
import { useCreateSource } from "@/hooks/use-queries"
import type { FormEvent } from "react"

export default function NewSourcePage() {
  const { t } = useTranslation()
  const router = useRouter()
  const createMutation = useCreateSource()

  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const type = formData.get("type") as string

    const body: Record<string, unknown> = { type }

    if (type === "path") {
      body.path = formData.get("path")
    } else if (type === "postgres") {
      body.host = formData.get("host")
      body.port = Number(formData.get("port"))
      body.user = formData.get("user")
      body.password = formData.get("password")
      body.database = formData.get("database")
    } else if (type === "postgres-container") {
      body.containerName = formData.get("containerName")
      body.user = formData.get("user")
      body.password = formData.get("password")
      body.database = formData.get("database")
    } else if (type === "docker-compose") {
      body.name = formData.get("name")
      body.path = formData.get("path")
      body.containers = (formData.get("containers") as string).split(",").map((c) => c.trim())
    }

    try {
      await createMutation.mutateAsync(body)
      router.push("/sources")
    } catch {
      alert("Failed to create source")
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Header title={t("sources.addSource")} />

      <Card>
        <CardHeader>
          <CardTitle>New Source</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Source Type</Label>
              <Select value="" onChange={() => {}} name="type">
                <option value="path">Path</option>
                <option value="postgres">PostgreSQL</option>
                <option value="postgres-container">PostgreSQL Container</option>
                <option value="docker-compose">Docker Compose</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="path">Path</Label>
              <Input id="path" name="path" placeholder="/data/documents" />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? t("common.loading") : t("common.create")}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push("/sources")}>
                {t("common.cancel")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
