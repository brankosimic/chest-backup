"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"
import { ClockIcon, CalendarIcon, RefreshCwIcon } from "lucide-react"
import { Layout } from "@/components/layout/Layout"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { getConfig, updateConfig } from "@/lib/api"
import { toast } from "sonner"

const presetCrons = [
  { label: "everyMinute", value: "* * * * *" },
  { label: "everyHour", value: "0 * * * *" },
  { label: "daily", value: "0 2 * * *" },
  { label: "weekly", value: "0 2 * * 0" },
  { label: "monthly", value: "0 2 1 * *" },
]

const Schedule = () => {
  const { t } = useTranslation()

  const [schedule, setSchedule] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      const result = await getConfig()

      if (result.data?.schedule) setSchedule(result.data.schedule)
    }

    void load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const result = await updateConfig({ ...{ retention: 30, sources: [], destinations: [] }, schedule })

    setSaving(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success(t("schedule.scheduleSaved"))
  }

  const handlePreset = (value: string) => setSchedule(value)

  return (
    <Layout title={t("schedule.title")}>
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <ClockIcon className="h-6 w-6 text-indigo-400" />
              <div>
                <h2 className="text-xl font-semibold text-white">{t("schedule.title")}</h2>
                <p className="text-sm text-slate-400">{t("schedule.cronHelp")}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">{t("schedule.cronExpression")}</label>
                <Input
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  placeholder="* * * * *"
                  className="font-mono text-lg"
                />
                <p className="text-xs text-slate-500">
                  Format: minute hour day-of-month month day-of-week
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-300 mb-3">{t("schedule.preview")}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {presetCrons.map(({ label, value }) => (
                    <button
                      key={label}
                      onClick={() => handlePreset(value)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${schedule === value ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"}`}
                    >
                      {t(`schedule.${label}`)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-800/30 border border-slate-800">
                <CalendarIcon className="h-5 w-5 text-indigo-400" />
                <div>
                  <p className="text-sm text-slate-400">{t("schedule.nextRun")}</p>
                  <p className="text-white font-medium">
                    {schedule ? "Next run calculated from cron expression" : t("schedule.noSchedule")}
                  </p>
                </div>
              </div>

              <Button onClick={handleSave} loading={saving} className="w-full">
                <RefreshCwIcon className="h-4 w-4" />
                {t("schedule.saveSchedule")}
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </Layout>
  )
}

export default Schedule
