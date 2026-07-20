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
  const [tempDir, setTempDir] = useState(() => localStorage.getItem("chest-backup-tempDir") ?? "/tmp")
  const [language, setLanguage] = useState(() => localStorage.getItem("chest-backup-language") ?? i18n.language)
  const [apiUser, setApiUser] = useState(() => localStorage.getItem("api_user") ?? "")
  const [apiPassword, setApiPassword] = useState(() => localStorage.getItem("api_password") ?? "")

  const handleSave = () => {
    try {
      localStorage.setItem("chest-backup-tempDir", tempDir)
      localStorage.setItem("chest-backup-language", language)
      localStorage.setItem("api_user", apiUser)
      if (apiPassword) {
        localStorage.setItem("api_password", apiPassword)
        localStorage.setItem("auth", btoa(`${apiUser}:${apiPassword}`))
      } else {
        localStorage.removeItem("api_password")
        localStorage.removeItem("auth")
      }
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

          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-3">API Credentials</h3>
            <div className="space-y-2">
              <Label htmlFor="apiUser">{t("sources.user")}</Label>
              <Input id="apiUser" value={apiUser} onChange={(e) => { setApiUser(e.target.value); }} placeholder="bane" />
            </div>
            <div className="space-y-2 mt-2">
              <Label htmlFor="apiPassword">{t("sources.password")}</Label>
              <Input id="apiPassword" type="password" value={apiPassword} onChange={(e) => { setApiPassword(e.target.value); }} placeholder="Password" />
            </div>
          </div>

          <Button onClick={handleSave} className="w-full">{t("common.save")}</Button>
        </CardContent>
      </Card>
    </div>
  )
}
