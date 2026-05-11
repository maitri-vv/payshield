import { NextResponse, type NextRequest } from "next/server"
import { PAYSH_CATEGORIES, PAYSH_SERVICES, type PayShCategory, type PayShService } from "../../../../../data/paysh-services"
import { SERVICE_RESEARCH_SEEDS, buildResearchSeedFromService, generateResearchReport, type Confidence, type ServiceResearchSeed } from "../../../../../services.seed"

export const dynamic = "force-dynamic"

const PAYSH_CATALOG_URL = "https://pay.sh/"
const SOURCE_TIMEOUT_MS = 8000

type ResearchReport = ServiceResearchSeed & {
  inferredProvider: string
  confidence: Confidence
}

const RESEARCH_REPORTS = Object.fromEntries(
  SERVICE_RESEARCH_SEEDS.map((service) => [service.slug.toLowerCase(), generateResearchReport(service)]),
) as Record<string, ResearchReport>

interface DirectSource {
  direct_alternative: string
  direct_cost_monthly: number
  direct_cost_label: string
  direct_source: string
  confidence: "high" | "medium"
  source_note: string
}

const DIRECT_SOURCES: Record<string, DirectSource> = {
  "quicknode/rpc": {
    direct_alternative: "QuickNode Build plan",
    direct_cost_monthly: 49,
    direct_cost_label: "$49/month",
    direct_source: "https://www.quicknode.com/pricing",
    confidence: "high",
    source_note: "QuickNode public pricing page lists Build at $49/month.",
  },
  "paysponge/coingecko": {
    direct_alternative: "CoinGecko Analyst API",
    direct_cost_monthly: 129,
    direct_cost_label: "$129/month",
    direct_source: "https://www.coingecko.com/en/api/pricing",
    confidence: "high",
    source_note: "CoinGecko public API pricing page lists Analyst at $129/month.",
  },
  "merit-systems/stablecrypto/market-data": {
    direct_alternative: "CoinGecko Analyst API",
    direct_cost_monthly: 129,
    direct_cost_label: "$129/month",
    direct_source: "https://www.coingecko.com/en/api/pricing",
    confidence: "medium",
    source_note: "StableCrypto includes multiple sources; CoinGecko Analyst is used as the comparable verified public plan.",
  },
  "paysponge/perplexity": {
    direct_alternative: "Perplexity Pro",
    direct_cost_monthly: 20,
    direct_cost_label: "$20/month",
    direct_source: "https://www.perplexity.ai/pro",
    confidence: "medium",
    source_note: "Public Perplexity Pro pricing is linked for user verification.",
  },
  "solana-foundation/google/language": {
    direct_alternative: "Google Cloud Natural Language API",
    direct_cost_monthly: 0,
    direct_cost_label: "usage based",
    direct_source: "https://cloud.google.com/natural-language/pricing",
    confidence: "high",
    source_note: "Google Cloud publishes usage-based Natural Language pricing.",
  },
  "paysponge/fal": {
    direct_alternative: "fal.ai pricing",
    direct_cost_monthly: 0,
    direct_cost_label: "usage based",
    direct_source: "https://fal.ai/pricing",
    confidence: "high",
    source_note: "fal.ai publishes usage-based model pricing, not a single monthly subscription.",
  },
}

interface SourceMeta {
  source_mode: "live" | "fallback"
  source_status: "verified" | "failed"
  pay_sh_source: string
  direct_source: string | null
  direct_source_status: "verified" | "unavailable"
  last_checked_at: string
  confidence: "high" | "medium" | "low" | "unknown"
  warning?: string
  source_note?: string
}

type SourcedPayShService = PayShService & {
  source_metadata: SourceMeta
  research_profile?: ResearchReport
}

interface LiveCatalogEntry {
  name: string
  slug: string
  category: PayShCategory
  endpoints: number
  paysh_price_label: string
  paysh_price_min: number
  paysh_price_max: number
  status: "free tier" | "metered"
  description: string
  paysh_url: string
}

function isCategory(value: string): value is PayShCategory {
  return PAYSH_CATEGORIES.includes(value as PayShCategory)
}

function savingsScore(label: string): number {
  const match = label.match(/(\d+)%/)
  return match ? Number(match[1]) : 0
}

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
}

function stripTags(value: string): string {
  return decodeHtml(value.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim()
}

function priceBounds(label: string): { min: number; max: number } {
  if (/free/i.test(label)) return { min: 0, max: 0 }
  const values = [...label.matchAll(/\$([\d,]+(?:\.\d+)?)/g)].map((match) => Number(match[1].replace(/,/g, "")))
  if (values.length === 0) return { min: 0, max: 0 }
  return { min: Math.min(...values), max: Math.max(...values) }
}

function normalizeStatus(value: string): "free tier" | "metered" {
  return value.toLowerCase().includes("metered") ? "metered" : "free tier"
}

function sourceUrl(href: string): string {
  return href.startsWith("http") ? href : new URL(href, PAYSH_CATALOG_URL).toString()
}

function parsePayShCatalog(html: string): LiveCatalogEntry[] {
  const entries: LiveCatalogEntry[] = []
  const anchorRegex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
  let match: RegExpExecArray | null

  while ((match = anchorRegex.exec(html)) !== null) {
    const href = decodeHtml(match[1])
    const text = stripTags(match[2])
    if (!text.includes(" Category ") || !text.includes(" Endpoints ") || !text.includes(" Price ") || !text.includes(" Status ")) continue

    const slugMatch = text.match(/\b[a-z0-9-]+\/[a-z0-9][a-z0-9\/-]*\b/)
    if (!slugMatch || slugMatch.index === undefined) continue

    const name = text.slice(0, slugMatch.index).trim()
    const slug = slugMatch[0]
    const rest = text.slice(slugMatch.index + slug.length).trim()
    const detailMatch = rest.match(/^(.*?)\s+Category\s+(AI\/ML|Media|Data|Compute|Storage|Search|Messaging|Crypto\/Finance|Maps|Other)\s+Endpoints\s+(\d+)\s+Price\s+(.+?)\s+Status\s+(free tier|metered|free)\b/i)
    if (!detailMatch || !name) continue

    const price = detailMatch[4].trim()
    const bounds = priceBounds(price)
    entries.push({
      name,
      slug,
      description: detailMatch[1].trim(),
      category: detailMatch[2] as PayShCategory,
      endpoints: Number(detailMatch[3]),
      paysh_price_label: price,
      paysh_price_min: bounds.min,
      paysh_price_max: bounds.max,
      status: normalizeStatus(detailMatch[5]),
      paysh_url: sourceUrl(href),
    })
  }

  return entries
}

function curatedMatch(entry: LiveCatalogEntry): PayShService | undefined {
  const lowerSlug = entry.slug.toLowerCase()
  const lowerName = entry.name.toLowerCase()
  return PAYSH_SERVICES.find((service) => service.slug.toLowerCase() === lowerSlug) ?? PAYSH_SERVICES.find((service) => service.name.toLowerCase() === lowerName)
}

function directSourceFor(slug: string): DirectSource | undefined {
  return DIRECT_SOURCES[slug.toLowerCase()]
}

function mergeLiveEntry(entry: LiveCatalogEntry, index: number, checkedAt: string): SourcedPayShService {
  const curated = curatedMatch(entry)
  const direct = directSourceFor(entry.slug)
  const research = RESEARCH_REPORTS[entry.slug.toLowerCase()]
  const hasDirect = Boolean(direct)
  const baseForResearch: PayShService = {
    id: curated?.id ?? `live-${String(index + 1).padStart(3, "0")}`,
    name: entry.name,
    provider: curated?.provider ?? entry.slug.split("/")[0],
    slug: entry.slug,
    category: entry.category,
    endpoints: entry.endpoints,
    paysh_price_min: entry.paysh_price_min,
    paysh_price_max: entry.paysh_price_max,
    paysh_price_label: entry.paysh_price_label,
    status: entry.status,
    description: entry.description,
    models_included: curated?.models_included ?? [],
    direct_alternative: direct?.direct_alternative ?? "Direct source not verified",
    direct_cost_monthly: direct?.direct_cost_monthly ?? 0,
    direct_cost_label: direct?.direct_cost_label ?? "source unavailable",
    direct_requires: curated?.direct_requires ?? ["Source verification needed"],
    break_even_requests: hasDirect ? curated?.break_even_requests ?? 0 : 0,
    best_for: curated?.best_for ?? "Live pay.sh service discovered from the public catalog.",
    paysh_advantage: curated?.paysh_advantage ?? "Live pay-per-use API access with no subscription required.",
    savings_low_volume: hasDirect ? curated?.savings_low_volume ?? "Source-linked comparison available." : "Savings not shown until direct pricing source is verified.",
    savings_high_volume: hasDirect ? curated?.savings_high_volume ?? "Source-linked comparison available." : "Savings not shown until direct pricing source is verified.",
    paysh_url: entry.paysh_url,
  }
  const researchProfile = research ?? generateResearchReport(buildResearchSeedFromService(baseForResearch))

  return {
    ...baseForResearch,
    research_profile: researchProfile,
    source_metadata: {
      source_mode: "live",
      source_status: "verified",
      pay_sh_source: PAYSH_CATALOG_URL,
      direct_source: direct?.direct_source ?? null,
      direct_source_status: direct ? "verified" : "unavailable",
      last_checked_at: checkedAt,
      confidence: direct?.confidence ?? "unknown",
      warning: direct ? undefined : "Direct pricing source is not verified for this service yet.",
      source_note: direct?.source_note,
    },
  }
}

function fallbackServices(checkedAt: string, warning: string): SourcedPayShService[] {
  return PAYSH_SERVICES.map((service) => ({
    ...service,
    direct_alternative: "Direct source not verified",
    direct_cost_monthly: 0,
    direct_cost_label: "source unavailable",
    research_profile: RESEARCH_REPORTS[service.slug.toLowerCase()],
    source_metadata: {
      source_mode: "fallback",
      source_status: "failed",
      pay_sh_source: PAYSH_CATALOG_URL,
      direct_source: null,
      direct_source_status: "unavailable",
      last_checked_at: checkedAt,
      confidence: "low",
      warning,
    },
  }))
}

async function liveServices(): Promise<{ services: SourcedPayShService[]; sourceMode: "live" | "fallback"; warning?: string }> {
  const checkedAt = new Date().toISOString()
  try {
    const response = await fetch(PAYSH_CATALOG_URL, { cache: "no-store", signal: AbortSignal.timeout(SOURCE_TIMEOUT_MS) })
    if (!response.ok) throw new Error(`pay.sh returned ${response.status}`)
    const entries = parsePayShCatalog(await response.text())
    if (entries.length === 0) throw new Error("No live pay.sh service rows could be parsed")
    return { services: entries.map((entry, index) => mergeLiveEntry(entry, index, checkedAt)), sourceMode: "live" }
  } catch (error) {
    const warning = error instanceof Error ? error.message : "Unknown pay.sh catalog fetch failure"
    return { services: fallbackServices(checkedAt, warning), sourceMode: "fallback", warning }
  }
}

function filterServices(services: SourcedPayShService[], category: string, service: string): SourcedPayShService[] {
  return services.filter((item) => {
    const categoryMatches = category === "all" || (isCategory(category) && item.category === category)
    const serviceMatches = service.length === 0 || item.slug.toLowerCase().includes(service.toLowerCase()) || item.name.toLowerCase().includes(service.toLowerCase())
    return categoryMatches && serviceMatches
  })
}

function compareShape(item: SourcedPayShService) {
  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    category: item.category,
    paysh_price_label: item.paysh_price_label,
    direct_alternative: item.direct_alternative,
    direct_cost_label: item.direct_cost_label,
    break_even_requests: item.break_even_requests,
    savings_low_volume: item.savings_low_volume,
    savings_high_volume: item.savings_high_volume,
    paysh_advantage: item.paysh_advantage,
    paysh_url: item.paysh_url,
    source_metadata: item.source_metadata,
    research_profile: item.research_profile,
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const category = searchParams.get("category") ?? "all"
  const service = searchParams.get("service") ?? ""
  const compare = searchParams.get("compare") === "true"
  const { services: allServices, sourceMode, warning } = await liveServices()
  const filtered = filterServices(allServices, category, service)
  const services = compare ? filtered.map(compareShape) : filtered
  const sortedMostValuable = [...allServices]
    .filter((item) => item.source_metadata.direct_source_status === "verified")
    .sort((a, b) => savingsScore(b.savings_low_volume) - savingsScore(a.savings_low_volume))
    .slice(0, 3)
    .map((item) => item.name)
  const verifiedServices = allServices.filter((item) => item.source_metadata.direct_source_status === "verified")

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    total_services: allServices.length,
    total_categories: PAYSH_CATEGORIES.length,
    query: { category, service, compare, source_mode: sourceMode },
    source: { mode: sourceMode, pay_sh_source: PAYSH_CATALOG_URL, warning: warning ?? null },
    summary: {
      avg_savings_low_volume: verifiedServices.length > 0 ? "source-linked only" : "not available",
      services_with_free_tier: allServices.filter((item) => item.status === "free tier").length,
      services_with_verified_direct_source: verifiedServices.length,
      most_valuable_for_agents: sortedMostValuable,
      total_direct_monthly_cost: verifiedServices.reduce((sum, item) => sum + item.direct_cost_monthly, 0),
      total_direct_monthly_cost_label: verifiedServices.length > 0 ? "sum of source-linked monthly direct plans only" : "not available",
      total_paysh_equivalent: "pay per use",
    },
    services,
  })
}



