import { QueryProvider } from "@/components/QueryProvider"
import "@/app/globals.css"

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <QueryProvider>
          {props.children}
        </QueryProvider>
      </body>
    </html>
  )
}
