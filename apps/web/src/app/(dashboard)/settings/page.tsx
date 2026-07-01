"use client"

import { useTranslation } from "react-i18next"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Header } from "@/components/layout/header"

export default function SettingsPage() {
  const { t, i18n } = useTranslation()
  const [tempDir, setTempDir] = useState("/tmp")
  const [language, setLanguage] = useState(i18n.language)

  const handleSave = () => {
    try {
      localStorage.setItem("chest-backup-tempDir", tempDir)
      localStorage.setItem("chest-backup-language", language)
    } catch { /* ignore */ }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Header title={t("settings.title")} subtitle={t("settings.subtitle")} />

      <Card>
        <CardHeader><CardTitle>General Settings</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>{t("settings.tempDir")}</Label>
            <Input value={tempDir} onChange={(e) => { setTempDir(e.target.value); }} placeholder={t("settings.tempDirPlaceholder")} />
          </div>

          <div className="space-y-2">
            <Label>{t("settings.language")}</Label>
            <Select value={language} onChange={(e) => { setLanguage(e.target.value); }}>
              <option value="en">English</option>
              <option value="bs">Bosanski</option>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("settings.theme")}</Label>
            <p className="text-sm text-muted-foreground">Theme settings will be available in a future update.</p>
          </div>

          <Button onClick={handleSave} className="w-full">{t("common.save")}</Button>
        </CardContent>
      </Card>
    </div>
  )
}
