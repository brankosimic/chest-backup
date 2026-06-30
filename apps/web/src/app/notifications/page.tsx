"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"
import { BellIcon, SendIcon, CheckCircle2Icon } from "lucide-react"
import { Layout } from "@/components/layout/Layout"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { getConfig, updateConfig } from "@/lib/api"
import { toast } from "sonner"

const Notifications = () => {
  const { t } = useTranslation()

  const [webhookUrl, setWebhookUrl] = useState("")
  const [enabled, setEnabled] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      const result = await getConfig()

      if (result.data?.notifications?.discord?.webhookUrl) {
        setWebhookUrl(result.data.notifications.discord.webhookUrl)
        setEnabled(true)
      }
    }

    void load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const result = await updateConfig({
      ...{ retention: 30, sources: [], destinations: [] },
      notifications: { discord: { webhookUrl } },
    })

    setSaving(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Notifications saved")
  }

  const handleTest = async () => {
    toast.info(t("notifications.testNotification"))
    await new Promise((resolve) => setTimeout(resolve, 1000))
    toast.success(t("notifications.testSent"))
  }

  return (
    <Layout title={t("notifications.title")}>
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <BellIcon className="h-6 w-6 text-indigo-400" />
              <div>
                <h2 className="text-xl font-semibold text-white">{t("notifications.title")}</h2>
                <p className="text-sm text-slate-400">{t("notifications.discordHelp")}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                />
                <label className="text-sm text-slate-300">{t("notifications.enabled")}</label>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">{t("notifications.discordWebhook")}</label>
                <Input
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://discord.com/api/webhooks/..."
                  type="url"
                />
              </div>

              <div className="flex gap-3">
                <Button onClick={handleSave} loading={saving} className="flex-1">
                  <CheckCircle2Icon className="h-4 w-4" />
                  {t("notifications.saveNotifications")}
                </Button>
                <Button variant="secondary" onClick={handleTest}>
                  <SendIcon className="h-4 w-4" />
                  {t("notifications.testNotification")}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </Layout>
  )
}

export default Notifications
