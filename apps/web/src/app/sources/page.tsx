"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"
import {
  DatabaseIcon,
  ServerIcon,
  ContainerIcon,
  HardDriveIcon,
  PlusIcon,
  Trash2Icon,
  PencilIcon,
} from "lucide-react"
import { Layout } from "@/components/layout/Layout"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { EmptyState } from "@/components/ui/EmptyState"
import { Modal } from "@/components/ui/Modal"
import { Input } from "@/components/ui/Input"
import { getSources, createSource, updateSource, deleteSource } from "@/lib/api"
import { toast } from "sonner"
import type { Source } from "@/types"

const sourceTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  path: HardDriveIcon,
  postgres: DatabaseIcon,
  "postgres-container": ContainerIcon,
  "docker-compose": ServerIcon,
}

const Sources = () => {
  const { t } = useTranslation()

  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSource, setEditingSource] = useState<Source | null>(null)
  const [formData, setFormData] = useState<Record<string, string | number | string[]>>({ type: "path", path: "" })

  useEffect(() => {
    const load = async () => {
      const result = await getSources()

      if (result.data) setSources(result.data)
      setLoading(false)
    }

    void load()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm(t("sources.confirmDeleteSource"))) return
    const result = await deleteSource(id)

    if (result.error) {
      toast.error("Failed to delete source")
      return
    }
    setSources((prev) => prev.filter((s) => s.id !== id))
    toast.success("Source deleted")
  }

  const handleSave = async () => {
    const id = editingSource?.id ?? crypto.randomUUID()
    const source = { ...formData, id } as Source
    const result = editingSource ? await updateSource(id, source) : await createSource(source)

    if (result.error) {
      toast.error("Failed to save source", {})
      return
    }
    if (editingSource) {
      setSources((prev) => prev.map((s) => (s.id === id ? result.data! : s)))
    } else {
      setSources((prev) => [...prev, result.data!])
    }
    setModalOpen(false)
    setEditingSource(null)
    setFormData({ type: "path", path: "" })
    toast.success("Source saved")
  }

  const openCreate = () => {
    setEditingSource(null)
    setFormData({ type: "path", path: "" })
    setModalOpen(true)
  }

  const openEdit = (source: Source) => {
    setEditingSource(source)
    setFormData(source as Record<string, string | number | string[]>)
    setModalOpen(true)
  }

  const renderFormFields = () => {
    const type = (formData.type ?? "path") as string

    if (type === "path") {
      return <Input label={t("sources.path")} value={(formData.path as string) ?? ""} onChange={(e) => setFormData({ ...formData, path: e.target.value })} placeholder={t("sources.pathPlaceholder")} />
    }
    if (type === "postgres") {
      return (
        <div className="space-y-4">
          <Input label={t("sources.postgresHost")} value={(formData.host as string) ?? ""} onChange={(e) => setFormData({ ...formData, host: e.target.value })} placeholder={t("sources.postgresHostPlaceholder")} />
          <Input label={t("sources.postgresPort")} type="number" value={(formData.port as number) ?? 5432} onChange={(e) => setFormData({ ...formData, port: Number(e.target.value) })} />
          <Input label={t("sources.postgresUser")} value={(formData.user as string) ?? ""} onChange={(e) => setFormData({ ...formData, user: e.target.value })} placeholder={t("sources.postgresUserPlaceholder")} />
          <Input label={t("sources.postgresDatabase")} value={(formData.database as string) ?? ""} onChange={(e) => setFormData({ ...formData, database: e.target.value })} placeholder={t("sources.postgresDatabasePlaceholder")} />
        </div>
      )
    }
    if (type === "postgres-container") {
      return (
        <div className="space-y-4">
          <Input label={t("sources.postgresContainerName")} value={(formData.containerName as string) ?? ""} onChange={(e) => setFormData({ ...formData, containerName: e.target.value })} placeholder={t("sources.postgresContainerNamePlaceholder")} />
          <Input label={t("sources.postgresUser")} value={(formData.user as string) ?? ""} onChange={(e) => setFormData({ ...formData, user: e.target.value })} placeholder={t("sources.postgresUserPlaceholder")} />
          <Input label={t("sources.postgresDatabase")} value={(formData.database as string) ?? ""} onChange={(e) => setFormData({ ...formData, database: e.target.value })} placeholder={t("sources.postgresDatabasePlaceholder")} />
        </div>
      )
    }
    if (type === "docker-compose") {
      return (
        <div className="space-y-4">
          <Input label={t("sources.dockerComposeName")} value={(formData.name as string) ?? ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder={t("sources.dockerComposeNamePlaceholder")} />
          <Input label={t("sources.dockerComposePath")} value={(formData.path as string) ?? ""} onChange={(e) => setFormData({ ...formData, path: e.target.value })} placeholder={t("sources.dockerComposePathPlaceholder")} />
        </div>
      )
    }
    return null
  }

  return (
    <Layout title={t("sources.title")}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-slate-400">{t("sources.title")}</p>
          <Button onClick={openCreate}>
            <PlusIcon className="h-4 w-4" />
            {t("sources.addSource")}
          </Button>
        </div>

        {sources.length === 0 ? (
          <EmptyState
            icon={DatabaseIcon}
            title={t("sources.noSources")}
            description={t("sources.noSourcesDescription")}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sources.map((source, index) => {
              const type = ("type" in source ? source.type : "path") as string
              const Icon = sourceTypeIcons[type] ?? DatabaseIcon

              return (
                <motion.div
                  key={source.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <Card hover>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                          <Icon className="h-5 w-5 text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white capitalize">{type.replace("-", " ")}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {"path" in source ? (source as { path: string }).path : JSON.stringify(source).slice(0, 60)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(source)} className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(source.id)} className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors">
                          <Trash2Icon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}

        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingSource ? t("sources.editSource") : t("sources.addSource")}>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">{t("sources.sourceType")}</label>
              <select
                value={(formData.type as string) ?? "path"}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="path">Path</option>
                <option value="postgres">PostgreSQL</option>
                <option value="postgres-container">PostgreSQL Container</option>
                <option value="docker-compose">Docker Compose</option>
              </select>
            </div>
            {renderFormFields()}
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button onClick={handleSave}>{t("common.save")}</Button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  )
}

export default Sources
