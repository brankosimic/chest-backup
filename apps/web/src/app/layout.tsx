import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Chest-Backup",
  description: "Backup management dashboard",
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {props.children}
      </body>
    </html>
  )
}
