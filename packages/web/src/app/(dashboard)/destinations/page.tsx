import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Header } from "@/components/layout/header"
import { DestinationRow } from "@/components/destinations/destination-row"
import { Plus } from "lucide-react"
import { useDestinations } from "@/hooks/use-queries"
import * as styles from "./page.styles"

const DestinationsPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: destinations, isLoading, isError, refetch } = useDestinations()

  if (isLoading) return <LoadingSpinner className="h-screen" />

  if (isError)
    return (
      <div className={styles.page}>
        <Header title={t("destinations.title")} subtitle={t("destinations.subtitle")} />
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

  return (
    <div className={styles.page}>
      <Header
        title={t("destinations.title")}
        subtitle={t("destinations.subtitle")}
        action={
          <Button onClick={() => void navigate("/destinations/new")}>
            <Plus className={styles.plusIcon} />
            {t("destinations.addDestination")}
          </Button>
        }
      />

      {!destinations?.length ? (
        <Card>
          <CardContent className={styles.emptyCard}>
            <p className={styles.emptyText}>{t("destinations.noDestinations")}</p>
            <p className={styles.emptyDesc}>{t("destinations.noDestinationsDesc")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className={styles.grid}>
          {destinations.map((dest) => (
            <DestinationRow key={dest.id} destination={dest} />
          ))}
          <button type="button" onClick={() => void navigate("/destinations/new")} className={styles.addBox}>
            <Plus className={styles.addBoxIcon} />
            {t("destinations.addDestination")}
          </button>
        </div>
      )}
    </div>
  )
}

export default DestinationsPage
