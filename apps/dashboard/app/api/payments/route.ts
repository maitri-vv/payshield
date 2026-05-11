import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const wallet = process.env.RECEIVER_WALLET ?? process.env.NEXT_PUBLIC_RECEIVER_WALLET ?? ""
  const key = process.env.HELIUS_API_KEY ?? ""

  if (!wallet || !key) {
    return NextResponse.json({
      signatures: [],
      wallet,
      warning: "Set RECEIVER_WALLET and HELIUS_API_KEY to fetch live payments.",
    })
  }

  const url = `https://api.helius.xyz/v0/addresses/${wallet}/transactions?api-key=${key}&limit=20`
  const response = await fetch(url, { cache: "no-store" })
  const transactions: any[] = await response.json()
  const signatures = Array.isArray(transactions)
    ? transactions.map((tx) => ({
        signature: tx.signature,
        timestamp: tx.timestamp,
        type: tx.type,
        fee: tx.fee,
      }))
    : []

  return NextResponse.json({ signatures, wallet })
}
