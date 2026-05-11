import type { Metadata } from "next"
import type { ReactNode } from "react"
// @ts-ignore
import "./globals.css"

export const metadata: Metadata = {
  title: "PayShield",
  description: "x402-gated intelligence for pay.sh services",
  icons: {
    icon: "/favicon.png",
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
