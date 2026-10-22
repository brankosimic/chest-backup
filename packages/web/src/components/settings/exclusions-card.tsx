"use client"

import { useEffect, useState } from "react"
import type { KeyboardEvent } from "react"
import { useTranslation } from "react-i18next"
import { X } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useExclude, useUpdateExclude, useSourceExclusions } from "@/hooks/use-queries"
import * as styles from "./exclusions-card.styles"

const ExclusionsCard = () => {
  const { t } = useTranslation()
  const { data: excludeData } = useExclude()
  const { data: exclusionData } = useSourceExclusions()
  const updateExclude = useUpdateExclude()
  const [patterns, setPatterns] = useState<string[]>([])
  const [draft, setDraft] = useState("")

  useEffect(() => {
    if (excludeData) setPatterns(excludeData.patterns)
  }, [excludeData])

  const skippedFiles = exclusionData?.sources.reduce((sum, source) => sum + source.excluded, 0) ?? 0

  const handleAdd = () => {
    const pattern = draft.trim()
    if (!pattern || patterns.includes(pattern)) return
    setPatterns((prev) => [...prev, pattern])
    setDraft("")
  }

  const handleRemove = (pattern: string) => {
    setPatterns((prev) => prev.filter((item) => item !== pattern))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return
    e.preventDefault()
    handleAdd()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("settings.exclusions")}</CardTitle>
        <CardDescription>{t("settings.exclusionsDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className={styles.field}>
          <Label>{t("settings.excludePatterns")}</Label>
          <div className={styles.inputRow}>
            <Input
              className={styles.patternInput}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value)
              }}
              onKeyDown={handleKeyDown}
              placeholder={t("settings.excludePatternPlaceholder")}
            />
            <Button variant="outline" onClick={handleAdd}>
              {t("settings.excludePatternAdd")}
            </Button>
          </div>
          <p className={styles.hint}>{t("settings.excludePatternHint")}</p>
        </div>

        {patterns.length ? (
          <ul className={styles.patternList}>
            {patterns.map((pattern) => (
              <li key={pattern} className={styles.patternItem}>
                <span className={styles.patternText}>{pattern}</span>
                <button
                  onClick={() => {
                    handleRemove(pattern)
                  }}
                  className={styles.removeButton}
                  title={t("common.remove")}
                >
                  <X className={styles.removeIcon} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.summary}>{t("settings.excludePatternsEmpty")}</p>
        )}

        {skippedFiles > 0 && (
          <p className={styles.summary}>{t("settings.exclusionsSkipped", { count: skippedFiles })}</p>
        )}

        <Button
          onClick={() => {
            updateExclude.mutate({ patterns })
          }}
          disabled={updateExclude.isPending}
          className="w-full"
        >
          {updateExclude.isPending ? t("common.loading") : t("common.save")}
        </Button>
      </CardContent>
    </Card>
  )
}

export { ExclusionsCard }
