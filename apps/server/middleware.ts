import { NextResponse, type NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const payment = request.headers.get("x-payment")

  if (!payment) {
    return NextResponse.json(
      {
        payTo: process.env.RECEIVER_WALLET ?? "YOUR_RECEIVER_WALLET_ADDRESS",
        amount: "0.001",
        asset: "SOL",
        network: "solana:devnet",
        resource: request.nextUrl.toString(),
        nonce: Date.now(),
      },
      { status: 402 },
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/api/paysh-intelligence"],
}
