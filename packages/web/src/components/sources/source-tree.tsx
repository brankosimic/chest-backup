import { createContext, useContext } from "react"
import { Trash2, ChevronRight } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { sourceIcon, sourceTitle, sourceDetailLines } from "@/lib/sources"
import type { TreeContextValue, TreeNodeRowProps, SourceRowProps } from "@/types/sources"
import { cn } from "@/lib/utils"
import * as styles from "./source-tree.styles"

const TreeContext = createContext<TreeContextValue | null>(null)

const useTree = () => {
  const ctx = useContext(TreeContext)
  if (!ctx) throw new Error("useTree must be used within TreeContext.Provider")
  return ctx
}

const TreeNodeRow = ({ node, depth }: TreeNodeRowProps) => {
  const ctx = useTree()
  const hasChildren = !!node.children?.length
  const isExpanded = ctx.expanded.has(node.id)

  const handleClick = () => {
    if (hasChildren) ctx.onToggle(node.id)
    else if (node.source) ctx.onNavigate(`/sources/${node.source.id}`)
  }

  return (
    <>
      <div className={styles.row} style={{ paddingLeft: depth * 20 + 12 }} onClick={handleClick}>
        <span className={styles.iconSlot}>
          {hasChildren ? (
            <ChevronRight className={cn(styles.chevron, isExpanded && "rotate-90")} />
          ) : (
            <span className={styles.spacer}>&ndash;</span>
          )}
        </span>
        {node.icon}
        <span className={styles.label}>{node.label}</span>
        {node.children && <span className={styles.count}>{node.children.length}</span>}
        {node.source && (
          <div className={styles.meta}>
            <span className={styles.count}>{formatDate(node.source.createdAt)}</span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                ctx.onDelete(node.source?.id ?? "", e)
              }}
              className={styles.deleteButton}
              title={ctx.t("common.delete")}
            >
              <Trash2 className={styles.trashIcon} />
            </button>
          </div>
        )}
      </div>
      {hasChildren &&
        isExpanded &&
        node.children?.map((child) => <TreeNodeRow key={child.id} node={child} depth={depth + 1} />)}
    </>
  )
}

const SourceRow = ({ source }: SourceRowProps) => {
  const ctx = useTree()
  const detailLines = sourceDetailLines(source, ctx.t)

  return (
    <div className={styles.row} onClick={() => { ctx.onNavigate(`/sources/${source.id}`) }}>
      <span className={styles.iconSlot}>
        <span className={styles.spacer}>&ndash;</span>
      </span>
      {sourceIcon(source.type)}
      <div className={styles.info}>
        <p className={styles.title}>{sourceTitle(source)}</p>
        {detailLines.map((line, i) => (
          <p key={i} className={styles.detailText}>
            {line}
          </p>
        ))}
      </div>
      <div className={styles.meta}>
        <span className={styles.count}>{formatDate(source.createdAt)}</span>
        <button
          onClick={(e) => {
            e.stopPropagation()
            ctx.onDelete(source.id, e)
          }}
          className={styles.deleteButton}
          title={ctx.t("common.delete")}
        >
          <Trash2 className={styles.trashIcon} />
        </button>
      </div>
    </div>
  )
}

export { TreeContext, useTree, TreeNodeRow, SourceRow }
