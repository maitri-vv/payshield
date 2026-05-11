export const runtime = "nodejs";
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js"
import bs58 from "bs58"
import { NextResponse, type NextRequest } from "next/server"

export const dynamic = "force-dynamic"

const SERVER_URL = "http://localhost:3001/api/paysh-intelligence"

interface AgentQueryRequest {
  category?: string
  service?: string
  compare?: boolean
}

interface PaymentRequirement {
  payTo: string
  amount: string
  asset: "SOL"
  network: "solana:devnet"
  resource: string
  nonce: number
}

function solToLamports(amount: string): number {
  return Math.round(Number(amount) * LAMPORTS_PER_SOL)
}

function getAgent(): { connection: Connection; keypair: Keypair } {
  const privateKey = process.env.AGENT_PRIVATE_KEY
  const rpcUrl = process.env.SOLANA_RPC_URL

  if (!privateKey || !rpcUrl) {
    throw new Error("Missing AGENT_PRIVATE_KEY or SOLANA_RPC_URL")
  }

  return {
    connection: new Connection(rpcUrl, "confirmed"),
    keypair: Keypair.fromSecretKey(bs58.decode(privateKey)),
  }
}

async function payRequirement(connection: Connection, keypair: Keypair, requirement: PaymentRequirement): Promise<string> {
  if (requirement.asset !== "SOL" || requirement.network !== "solana:devnet") {
    throw new Error(`Unsupported payment request: ${requirement.asset} on ${requirement.network}`)
  }

  const receiver = new PublicKey(requirement.payTo)
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: keypair.publicKey,
      toPubkey: receiver,
      lamports: solToLamports(requirement.amount),
    }),
  )

  return sendAndConfirmTransaction(connection, transaction, [keypair], { commitment: "confirmed" })
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AgentQueryRequest
    const params = new URLSearchParams()
    if (body.category) params.set("category", body.category)
    if (body.service) params.set("service", body.service)
    if (body.compare !== undefined) params.set("compare", String(body.compare))

    const url = `${SERVER_URL}${params.toString() ? `?${params.toString()}` : ""}`
    const { connection, keypair } = getAgent()
    const initial = await fetch(url)
    let txSignature = "dashboard-internal-bypass"
    let data: unknown

    if (initial.status === 402) {
      const requirement = (await initial.json()) as PaymentRequirement
      txSignature = await payRequirement(connection, keypair, requirement)
      const paid = await fetch(url, { headers: { "X-Payment": txSignature } })
      data = await paid.json()

      if (!paid.ok) {
        return NextResponse.json({ success: false, data, txSignature, walletAddress: keypair.publicKey.toBase58() }, { status: paid.status })
      }
    } else {
      data = await initial.json()
    }

    return NextResponse.json({
      success: true,
      data,
      txSignature,
      walletAddress: keypair.publicKey.toBase58(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown dashboard agent-query error",
      },
      { status: 500 },
    )
  }
}
