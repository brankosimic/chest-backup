import { LanguageProvider } from "@/components/providers/LanguageProvider"
import { SidebarProvider } from "@/components/providers/SidebarProvider"
import { Toaster } from "sonner"

interface Props {
  children: React.ReactNode
}

const RootLayout = ({ children }: Props) => {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <LanguageProvider>
          <SidebarProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: "#0f172a",
                  border: "1px solid #334155",
                  color: "#f8fafc",
                },
              }}
            />
          </SidebarProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}

export default RootLayout
