import { cn } from "@/lib/utils"
import type { SkeletonProps } from "@/types/ui"
import * as styles from "./skeleton.styles"

const Skeleton = ({ className, ...props }: SkeletonProps) => (
  <div className={cn(styles.skeleton, className)} {...props} />
)

export { Skeleton }
