import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { StatCardProps } from "@/types/backup"
import * as styles from "./stat-card.styles"

const StatCard = ({ props }: { props: StatCardProps }) => (
  <Card>
    <CardHeader className={styles.header}>
      <CardTitle className={styles.title}>{props.title}</CardTitle>
      {props.icon}
    </CardHeader>
    <CardContent>
      <div className={styles.value}>{props.value}</div>
    </CardContent>
  </Card>
)

export { StatCard }
