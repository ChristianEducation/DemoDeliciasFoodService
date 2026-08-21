import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sistema de Pedidos - Delicias Food Service",
  description: "Sistema de pedidos de almuerzos y colaciones",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className} style={{ backgroundColor: "#f0f6fe" }}>
        {children}
      </body>
    </html>
  )
}
