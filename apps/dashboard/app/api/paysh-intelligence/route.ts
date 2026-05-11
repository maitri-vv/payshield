export const runtime = "nodejs";
import { NextResponse, type NextRequest } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const url = `http://localhost:3001/api/paysh-intelligence${request.nextUrl.search}`
  const response = await fetch(url, {
    headers: {
      "X-Payment": "dashboard-internal-bypass",
    },
  })
  const data: any = await response.json()

  return NextResponse.json(data, { status: response.status })
}
