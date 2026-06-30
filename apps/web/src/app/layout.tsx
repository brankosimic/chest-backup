import type { Metadata } from "next"
import { QueryProvider } from "@/components/QueryProvider"
import "./globals.css"

export const metadata: Metadata = {
  title: "Chest-Backup",
  description: "Backup management dashboard",
  icons: [{ rel: "icon", url: "/favicon.svg", type: "image/svg+xml" }],
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <QueryProvider>
          {props.children}
        </QueryProvider>
      </body>
    </html>
  )
}
