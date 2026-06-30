"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"
import {
  FolderIcon,
  UploadIcon,
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
import { getDestinations, createDestination, updateDestination, deleteDestination } from "@/lib/api"
import { toast } from "sonner"
import type { Destination } from "@/types"

const Destinations = () => {
  const { t } = useTranslation()

  const [destinations, setDestinations] = useState<Destination[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingDest, setEditingDest] = useState<Destination | null>(null)
  const [formData, setFormData] = useState<Record<string, string | number | boolean>>({ type: "local", path: "" })

  useEffect(() => {
    const load = async () => {
      const result = await getDestinations()

      if (result.data) setDestinations(result.data)
      setLoading(false)
    }

    void load()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm(t("destinations.confirmDeleteDestination"))) return
    const result = await deleteDestination(id)

    if (result.error) {
      toast.error(result.error)
      return
    }
    setDestinations((prev) => prev.filter((d) => d.id !== id))
    toast.success("Destination deleted")
  }

  const handleSave = async () => {
    const id = editingDest?.id ?? crypto.randomUUID()
    const dest = { ...formData, id } as Destination
    const result = editingDest ? await updateDestination(id, dest) : await createDestination(dest)

    if (result.error) {
      toast.error(result.error || "Failed to save destination", {})
      return
    }
    if (editingDest) {
      setDestinations((prev) => prev.map((d) => (d.id === id ? result.data! : d)))
    } else {
      setDestinations((prev) => [...prev, result.data!])
    }
    setModalOpen(false)
    setEditingDest(null)
    setFormData({ type: "local", path: "" })
    toast.success("Destination saved")
  }

  const openCreate = () => {
    setEditingDest(null)
    setFormData({ type: "local", path: "" })
    setModalOpen(true)
  }

  const openEdit = (dest: Destination) => {
    setEditingDest(dest)
    setFormData(dest as Record<string, string | number | boolean>)
    setModalOpen(true)
  }

  return (
    <Layout title={t("destinations.title")}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-slate-400">{t("destinations.title")}</p>
          <Button onClick={openCreate}>
            <PlusIcon className="h-4 w-4" />
            {t("destinations.addDestination")}
          </Button>
        </div>

        {destinations.length === 0 ? (
          <EmptyState
            icon={FolderIcon}
            title={t("destinations.noDestinations")}
            description={t("destinations.noDestinationsDescription")}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {destinations.map((dest, index) => {
              const type = ("type" in dest ? dest.type : "local") as string

              return (
                <motion.div
                  key={dest.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <Card hover>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                          <UploadIcon className="h-5 w-5 text-amber-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white capitalize">{type}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {"path" in dest ? (dest as { path: string }).path : JSON.stringify(dest).slice(0, 60)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(dest)} className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(dest.id)} className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors">
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

        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingDest ? t("destinations.editDestination") : t("destinations.addDestination")}>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">{t("destinations.destType")}</label>
              <select
                value={(formData.type as string) ?? "local"}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="local">Local</option>
                <option value="sftp">SFTP</option>
              </select>
            </div>
            <Input label={t("destinations.localPath")} value={(formData.path as string) ?? ""} onChange={(e) => setFormData({ ...formData, path: e.target.value })} placeholder={t("destinations.localPathPlaceholder")} />
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

export default Destinations
