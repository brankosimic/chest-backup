import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { NewSourceFormProvider } from "@/hooks/use-new-source"
import { NewSourceForm } from "@/components/sources/new-source-form"
import * as styles from "./page.styles"

const NewSourcePage = () => {
  const { t } = useTranslation()
  return (
    <div className={styles.page}>
      <Header title={t("sources.addSource")} />

      <Card>
        <CardHeader>
          <CardTitle>{t("sources.addSource")}</CardTitle>
        </CardHeader>
        <CardContent>
          <NewSourceFormProvider>
            <NewSourceForm />
          </NewSourceFormProvider>
        </CardContent>
      </Card>
    </div>
  )
}

export default NewSourcePage
