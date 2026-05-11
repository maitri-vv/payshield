import dotenv from "dotenv"
import { AgentPayClient, type PayShIntelligenceResult, type PayShService, shortAddress } from "@payshield/sdk"

dotenv.config({ path: "../../.env" })

function dollars(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value)
}

function printSection(title: string): void {
  console.log("")
  console.log("=".repeat(72))
  console.log(` ${title}`)
  console.log("=".repeat(72))
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing ${name}. Create .env from .env.example before running the demo.`)
  }
  return value
}

function categoryBreakdown(services: PayShService[]): Record<string, number> {
  return services.reduce<Record<string, number>>((acc, service) => {
    acc[service.category] = (acc[service.category] ?? 0) + 1
    return acc
  }, {})
}

function assertResult(result: { success: boolean; error?: string; data?: PayShIntelligenceResult }): PayShIntelligenceResult {
  if (!result.success || !result.data) {
    throw new Error(result.error ?? "PayShield query failed")
  }

  return result.data
}

async function main(): Promise<void> {
  const client = new AgentPayClient({
    privateKey: requireEnv("AGENT_PRIVATE_KEY"),
    rpcUrl: requireEnv("SOLANA_RPC_URL"),
  })

  printSection("PayShield AI Agent Demo")
  console.log(`Agent wallet: ${client.publicKey}`)
  console.log(`SOL balance: ${(await client.solBalance()).toFixed(4)} SOL`)
  console.log(`USDC balance: ${(await client.usdcBalance()).toFixed(6)} USDC`)

  printSection("Query 1: All pay.sh intelligence")
  const allResult = await client.queryPayShIntelligence({ category: "all" })
  const all = assertResult(allResult)
  console.log(`Payment TX: ${allResult.txSignature ?? "not required"}`)
  console.log(`Total services found: ${all.total_services}`)
  console.log(`Total direct cost if subscribed to everything: ${dollars(all.summary.total_direct_monthly_cost)}/month`)
  console.log("Top 5 most valuable services for agents:")
  all.services.slice(0, 5).forEach((service, index) => {
    console.log(`  ${index + 1}. ${service.name} - ${service.paysh_advantage}`)
  })
  console.log("Category breakdown:")
  Object.entries(categoryBreakdown(all.services)).forEach(([category, count]) => {
    console.log(`  ${category.padEnd(16)} ${String(count).padStart(2)} services`)
  })

  printSection("Query 2: Media services")
  const mediaResult = await client.queryPayShIntelligence({ category: "Media" })
  const media = assertResult(mediaResult)
  console.log(`Payment TX: ${mediaResult.txSignature ?? "not required"}`)
  media.services.forEach((service) => {
    console.log(`- ${service.name.padEnd(34)} ${service.paysh_price_label.padEnd(16)} vs ${service.direct_cost_label}`)
    console.log(`  ${service.savings_low_volume}`)
  })

  printSection("Query 3: StableStudio deep dive")
  const stableStudioResult = await client.queryPayShIntelligence({ service: "stablestudio" })
  const stableStudioData = assertResult(stableStudioResult)
  const stableStudio = stableStudioData.services[0]
  console.log(`Payment TX: ${stableStudioResult.txSignature ?? "not required"}`)
  console.log(`${stableStudio.name} (${stableStudio.slug})`)
  console.log(`pay.sh price: ${stableStudio.paysh_price_label}`)
  console.log(`Direct alternative: ${stableStudio.direct_alternative} at ${stableStudio.direct_cost_label}`)
  console.log(`Models: ${stableStudio.models_included.join(", ")}`)
  console.log(`Best for: ${stableStudio.best_for}`)
  console.log(`Advantage: ${stableStudio.paysh_advantage}`)

  printSection("Run complete")
  console.log(`Wallet: ${shortAddress(client.publicKey)}`)
  console.log("Total USDC spent: 0.003 USDC for 3 queries")
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
