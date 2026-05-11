import type { ReactNode } from "react"

export const metadata = {
  title: "PayShield API",
  description: "x402-protected pay.sh intelligence API",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
