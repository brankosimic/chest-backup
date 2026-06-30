"use client"

import { useTranslation } from "react-i18next"
import { AnimatePresence, motion } from "framer-motion"
import { Header } from "@/components/layout/Header"

interface Props {
  children: React.ReactNode
  title: string
}

const Layout = ({ children, title }: Props) => {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header title={title} />
      <main className="p-4 lg:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

export { Layout }
