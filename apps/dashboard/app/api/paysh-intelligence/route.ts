export const runtime = "nodejs";
import { NextResponse, type NextRequest } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/paysh-intelligence${request.nextUrl.search}`
  const response = await fetch(url, {
    headers: {
      "X-Payment": "dashboard-internal-bypass",
    },
  })
  const data: any = await response.json()

  return NextResponse.json(data, { status: response.status })
}
