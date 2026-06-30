"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"
import { SettingsIcon, SaveIcon, ServerIcon } from "lucide-react"
import { Layout } from "@/components/layout/Layout"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { getConfig, updateConfig } from "@/lib/api"
import { toast } from "sonner"

const Settings = () => {
  const { t } = useTranslation()

  const [retention, setRetention] = useState(30)
  const [tempDir, setTempDir] = useState("/tmp/chest-backup")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      const result = await getConfig()

      if (result.data) {
        setRetention(result.data.retention ?? 30)
        setTempDir(result.data.tempDir ?? "/tmp/chest-backup")
      }
    }

    void load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const result = await updateConfig({
      retention,
      tempDir,
      sources: [],
      destinations: [],
    })

    setSaving(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success(t("settings.settingsSaved"))
  }

  return (
    <Layout title={t("settings.title")}>
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <SettingsIcon className="h-6 w-6 text-indigo-400" />
              <h2 className="text-xl font-semibold text-white">{t("settings.title")}</h2>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">{t("settings.retentionDays")}</label>
                <Input
                  type="number"
                  value={retention}
                  onChange={(e) => setRetention(Number(e.target.value))}
                  placeholder={t("settings.retentionDaysPlaceholder")}
                  min={1}
                />
                <p className="text-xs text-slate-500">
                  How many days to keep backup archives
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">{t("settings.tempDir")}</label>
                <Input
                  value={tempDir}
                  onChange={(e) => setTempDir(e.target.value)}
                  placeholder={t("settings.tempDirPlaceholder")}
                />
                <p className="text-xs text-slate-500">
                  Temporary directory for backup operations
                </p>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-800/30 border border-slate-800">
                <ServerIcon className="h-5 w-5 text-indigo-400" />
                <div>
                  <p className="text-sm text-slate-400">{t("settings.daemonStatus")}</p>
                  <p className="text-white font-medium">{t("settings.daemonRunning")}</p>
                </div>
              </div>

              <Button onClick={handleSave} loading={saving} className="w-full">
                <SaveIcon className="h-4 w-4" />
                {t("settings.settingsSaved")}
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </Layout>
  )
}

export default Settings
