import { useState } from "react"
import type { MouseEvent } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Header } from "@/components/layout/header"
import { Plus } from "lucide-react"
import { useSources, useDeleteSource } from "@/hooks/use-queries"
import type { Source } from "@chest-backup/shared"
import type { TreeNode, SourceSection } from "@/types/sources"
import { sourceIcon, sourceTypeLabelKey, buildPathTree, SOURCE_TYPES, SourceType } from "@/lib/sources"
import { TreeContext, TreeNodeRow, SourceRow } from "@/components/sources/source-tree"
import * as styles from "./page.styles"

const countLeaves = (nodes: TreeNode[]): number =>
  nodes.reduce((sum, n) => sum + (n.children ? countLeaves(n.children) : 1), 0)

const pathSection = (items: Source[]): SourceSection => ({
  type: SourceType.Path,
  label: sourceTypeLabelKey(SourceType.Path),
  icon: sourceIcon(SourceType.Path),
  count: countLeaves(buildPathTree(items)),
  dirTree: buildPathTree(items),
  flatItems: [],
})

const flatSection = (type: string, items: Source[]): SourceSection => ({
  type,
  label: sourceTypeLabelKey(type),
  icon: sourceIcon(type),
  count: items.length,
  dirTree: [],
  flatItems: items,
})

const buildSections = (sources: Source[]): SourceSection[] =>
  SOURCE_TYPES.map((type) => {
    const items = sources.filter((s) => s.type === type)
    if (!items.length) return null
    return type === SourceType.Path ? pathSection(items) : flatSection(type, items)
  }).filter(Boolean) as SourceSection[]

const SourcesPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: sources, isLoading, isError, refetch } = useSources()
  const deleteSource = useDeleteSource()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleDelete = (id: string, e: MouseEvent) => {
    e.stopPropagation()
    if (window.confirm(t("common.confirmDelete"))) deleteSource.mutate(id)
  }

  if (isLoading) return <LoadingSpinner className="h-screen" />

  if (isError)
    return (
      <div className={styles.errorPage}>
        <Header
          title={t("sources.title")}
          subtitle={t("sources.subtitle")}
          action={
            <Button onClick={() => void navigate("/sources/new")}>
              <Plus className={styles.plusIcon} />
              {t("sources.addSource")}
            </Button>
          }
        />
        <Card>
          <CardContent className={styles.errorCard}>
            <p className={styles.emptyText}>{t("common.error")}</p>
            <Button variant="outline" onClick={() => void refetch()}>
              {t("common.refresh")}
            </Button>
          </CardContent>
        </Card>
      </div>
    )

  const sections = buildSections(sources ?? [])

  return (
    <div className={styles.page}>
      <Header
        title={t("sources.title")}
        subtitle={t("sources.subtitle")}
        action={
          <Button onClick={() => void navigate("/sources/new")}>
            <Plus className={styles.plusIcon} />
            {t("sources.addSource")}
          </Button>
        }
      />

      {!sections.length ? (
        <Card>
          <CardContent className={styles.emptyCard}>
            <p className={styles.emptyText}>{t("sources.noSources")}</p>
            <p className={styles.emptyDesc}>{t("sources.noSourcesDesc")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className={styles.sections}>
          {sections.map((section) => (
            <section key={section.type}>
              <div className={styles.sectionHeader}>
                {section.icon}
                <h2 className={styles.sectionTitle}>{t(section.label)}</h2>
                <span className={styles.sectionCount}>({String(section.count)})</span>
              </div>

              {section.dirTree.length ? (
                <TreeContext.Provider
                  value={{
                    expanded,
                    onToggle: toggle,
                    onDelete: handleDelete,
                    onNavigate: (path) => void navigate(path),
                    t,
                  }}
                >
                  <div className={styles.treePanel}>
                    {section.dirTree.map((node) => (
                      <TreeNodeRow key={node.id} node={node} depth={0} />
                    ))}
                  </div>
                </TreeContext.Provider>
              ) : (
                <TreeContext.Provider
                  value={{
                    expanded,
                    onToggle: toggle,
                    onDelete: handleDelete,
                    onNavigate: (path) => void navigate(path),
                    t,
                  }}
                >
                  <div className={styles.treePanel}>
                    {section.flatItems.map((source) => (
                      <SourceRow key={source.id} source={source} />
                    ))}
                  </div>
                </TreeContext.Provider>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

export default SourcesPage
