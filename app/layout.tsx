import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { AuthProvider } from "@/context/AuthContext"

export const metadata: Metadata = {
    title: "Scrum Master",
    description: "Gerencie seus projetos com metodologia Scrum",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="pt-br" className={`${GeistSans.variable} ${GeistMono.variable}`}>
        <body>
        <AuthProvider>{children}</AuthProvider>
        </body>
        </html>
    )
}
