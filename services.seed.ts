import { PAYSH_SERVICES, type PayShService } from "./data/paysh-services"

export type Confidence = "High" | "Medium" | "Low"
export interface Evidence { title: string; url: string; proves: string; confidenceScore: number }
export interface InfraGuess { component: string; likelyProviderCandidates: string[]; confidence: Confidence; rationale: string }
export interface ComparisonMatrix { payShX402Usage: string; directProviderUsage: string; setupFriction: string; apiKeyRequired: "Yes" | "No" | "Sometimes"; accountRequired: "Yes" | "No" | "Sometimes"; billingRequired: "Yes" | "No" | "Sometimes"; agentFriendliness: string; bestUseCase: string }
export interface ServiceResearchSeed {
  slug: string; name: string; category: string; payShPrice: string; knownDirectSource?: string
  officialUrls: { website?: string; docs?: string; pricing?: string; github?: string }
  officialOffer?: { label: string; price: string; auth: string; sourceUrl: string; notes: string }
  payShOffer?: { label: string; price: string; auth: string; sourceUrl: string; notes: string }
  evidence: Evidence[]; probableInfra: InfraGuess[]; comparison: ComparisonMatrix; notes: string
}

type SourceProfile = {
  label: string; website?: string; docs?: string; pricing?: string; github?: string
  price: string; auth: string; proof: string; components: InfraGuess[]; score?: number
}

const PAYSH = "https://pay.sh/"
const c = (component: string, candidates: string[], confidence: Confidence, rationale: string): InfraGuess => ({ component, likelyProviderCandidates: candidates, confidence, rationale })
const fallbackComponents = (s: PayShService): InfraGuess[] => [
  c("pay.sh catalog entry", [s.slug], "High", `pay.sh lists ${s.name} with ${s.endpoints} endpoint(s) and ${s.paysh_price_label} pricing.`),
  c("Payment/authentication layer", ["pay.sh", "x402-style wallet payment"], "High", "The verified agent path is payment-gated HTTP access through pay.sh."),
]

const exact: Record<string, SourceProfile> = {
  "paysponge/perplexity": {
    label: "Perplexity API", website: "https://www.perplexity.ai/", docs: "https://docs.perplexity.ai/", pricing: "https://docs.perplexity.ai/docs/getting-started/pricing",
    price: "Search API $5 / 1K requests; Sonar request fees vary by context size plus token pricing.", auth: "Perplexity API account and API key for direct use.",
    proof: "Perplexity official pricing docs list Search API, Sonar request fees, token pricing, and tool pricing.",
    components: [c("Direct API provider", ["Perplexity API", "Sonar"], "High", "Official docs list Sonar/Search API pricing and model behavior."), c("Direct authentication", ["Perplexity API key"], "High", "Direct API usage is through Perplexity credentials.")],
  },
  "dtelecom/voice": {
    label: "dTelecom x402 Gateway", website: "https://x402.dtelecom.org/", docs: "https://x402.dtelecom.org/", pricing: "https://x402.dtelecom.org/",
    price: "WebRTC $0.001/audio participant min; STT $0.006/min; TTS $0.008/1K chars; bundled voice around $0.015/min.", auth: "x402 / MPP; no API keys or accounts on the official gateway.",
    proof: "dTelecom's gateway page lists WebRTC, STT, TTS, bundle pricing, supported networks, and no-key/no-account access.",
    components: [c("Realtime media layer", ["dTelecom DePIN", "LiveKit-based decentralized SFU"], "High", "The official gateway describes WebRTC on dTelecom DePIN."), c("Speech-to-text", ["Parakeet-TDT", "Whisper fallback"], "High", "The official STT section names Parakeet-TDT and Whisper fallback."), c("Text-to-speech", ["Kokoro 82M"], "High", "The official TTS section names Kokoro 82M and per-character billing.")],
  },
  "solana-foundation/google/language": {
    label: "Google Cloud Natural Language API", website: "https://cloud.google.com/natural-language", docs: "https://cloud.google.com/natural-language/docs", pricing: "https://cloud.google.com/natural-language/pricing",
    price: "Usage-based Natural Language pricing by feature/unit.", auth: "Google Cloud project, billing account, and API credentials for direct use.", proof: "Google Cloud publishes Natural Language API docs and pricing.",
    components: [c("Direct API provider", ["Google Cloud Natural Language API"], "High", "Official Google Cloud docs/pricing document the API."), c("Direct authentication", ["Google Cloud project", "API credentials", "billing account"], "High", "Direct Google Cloud APIs require project credentials and billing setup.")],
  },
  "quicknode/rpc": { label: "QuickNode RPC", website: "https://www.quicknode.com/", docs: "https://www.quicknode.com/docs", pricing: "https://www.quicknode.com/pricing", price: "QuickNode publishes monthly RPC plans and limits on its pricing page.", auth: "QuickNode account and endpoint credentials.", proof: "QuickNode's official pricing/docs are the source for direct RPC plans.", components: [c("Direct RPC provider", ["QuickNode"], "High", "Official QuickNode docs/pricing describe RPC access."), c("Direct authentication", ["QuickNode endpoint credentials"], "High", "Direct RPC usage is through provisioned endpoints.")] },
  "paysponge/fal": { label: "fal.ai", website: "https://fal.ai/", docs: "https://fal.ai/docs", pricing: "https://fal.ai/pricing", price: "Usage-based model pricing; exact price depends on model and job parameters.", auth: "fal.ai account and API credentials.", proof: "fal.ai publishes docs and usage-based pricing for model inference.", components: [c("Direct inference provider", ["fal.ai"], "High", "Official fal.ai pricing/docs describe model inference."), c("Direct authentication", ["fal.ai API key"], "High", "Direct API usage requires credentials.")] },
  "paysponge/coingecko": { label: "CoinGecko API", website: "https://www.coingecko.com/en/api", docs: "https://docs.coingecko.com/", pricing: "https://www.coingecko.com/en/api/pricing", price: "CoinGecko publishes API subscription tiers and limits on its pricing page.", auth: "CoinGecko API account and key.", proof: "CoinGecko official API docs/pricing describe direct API plans.", components: [c("Direct market-data provider", ["CoinGecko API"], "High", "Official docs/pricing describe market data access."), c("Direct authentication", ["CoinGecko API key"], "High", "Direct usage is key-based.")] },
  "agentmail/email": { label: "AgentMail", website: "https://www.agentmail.to/", docs: "https://docs.agentmail.to/introduction", pricing: "https://www.agentmail.to/pricing", price: "Free $0/month; Developer $20/month; Startup $200/month; Enterprise custom.", auth: "AgentMail account/API key for direct use; no credit card required for free tier.", proof: "AgentMail's official pricing page lists free, Developer, Startup, and Enterprise plans; docs describe the inbox API.", components: [c("Direct agent inbox API", ["AgentMail"], "High", "Official docs describe API-managed inboxes for agents."), c("Direct authentication", ["AgentMail API key"], "High", "AgentMail API docs show API key/client access.")] },
  "merit-systems/stableemail/email": { label: "StableEmail official x402 email API", website: "https://stableemail.dev/", docs: "https://www.x402.org/ecosystem", pricing: "https://stableemail.dev/", github: "https://github.com/Merit-Systems/x402email", price: "$0.02 for POST /api/send; $0.005 subdomain/inbox sends; $1/month inbox; $5 subdomain; $8/year inbox.", auth: "x402 / MPP, with SIWX for signer/status/admin-style endpoints.", proof: "StableEmail's official page lists endpoint prices, x402/MPP auth, and AWS SES delivery.", components: [c("Outbound email delivery", ["AWS SES"], "High", "StableEmail's official page says email is delivered via AWS SES."), c("Payment challenge", ["x402", "MPP"], "High", "The official page lists 402 payment requirements and x402 / MPP auth."), c("Wallet/session authorization", ["SIWX"], "High", "The endpoint table marks status/update/cancel-style endpoints as Free SIWX."), c("Agent onboarding path", ["AgentCash CLI"], "High", "The official page shows npx agentcash onboard, try, and add commands.")] },
  "merit-systems/stablephone/calls": { label: "StablePhone official x402 calls API", website: "https://stablephone.dev/", docs: "https://stablephone.dev/llms.txt", pricing: "https://stablephone.dev/", price: "Call $0.54; number $20/30 days; top-up $15; iMessage/FaceTime lookup $0.05; status/list free.", auth: "x402 / MPP paid HTTP flow; no API keys or accounts on the official page.", proof: "StablePhone's page lists endpoint prices, x402 flow, and no-key/no-account positioning.", components: [c("AI call endpoint", ["StablePhone /api/call"], "High", "The official endpoint table lists POST /api/call."), c("Phone number workflow", ["/api/number", "/api/number/topup"], "High", "The official table lists number purchase and top-up endpoints."), c("Voice catalog", ["StablePhone voices", "Bland.ai voice IDs"], "High", "The official page lists built-in voices and custom Bland.ai IDs.")] },
  "merit-systems/stableupload/hosting": { label: "StableUpload official x402 hosting API", website: "https://stableupload.dev/", docs: "https://stableupload.dev/.well-known/x402/llms.txt", pricing: "https://stableupload.dev/", price: "$0.02 for 10 MB / 6 months; $0.20 for 100 MB / 6 months; $2.00 for 1 GB / 6 months; short-term tiers available.", auth: "x402 / AgentCash paid upload-session flow.", proof: "StableUpload's official page lists upload tiers, retention windows, and POST /api/upload flow.", components: [c("Upload session", ["StableUpload POST /api/upload"], "High", "The official page documents the paid upload-session flow."), c("Public file delivery", ["StableUpload public download URL"], "High", "The official page says the resulting URL is public until expiration.")] },
  "merit-systems/stablesocial/social-data": { label: "StableSocial official x402 social-data API", website: "https://stablesocial.dev/", docs: "https://stablesocial.dev/llms.txt", pricing: "https://stablesocial.dev/", price: "$0.06 per request across TikTok, Instagram, Facebook, and Reddit endpoint groups.", auth: "x402 / AgentCash paid HTTP flow; no signup, no keys per official page.", proof: "StableSocial's official page lists 4 platforms, 36 endpoints, and $0.06 per request.", components: [c("Social platform coverage", ["TikTok", "Instagram", "Facebook", "Reddit"], "High", "The official page lists these four platforms."), c("Endpoint pricing", ["$0.06 per request"], "High", "The official page lists $0.06 per request.")] },
  "merit-systems/stableenrich/enrichment": { label: "StableEnrich official x402 enrichment API", website: "https://stableenrich.dev/", docs: "https://stableenrich.dev/docs", pricing: "https://stableenrich.dev/", price: "People enrichment $0.015; web search $0.015; web scraping $0.015; places/location $0.045; social data $0.015; contact info $0.03.", auth: "x402 / MPP via AgentCash; USDC on Base, Solana, or Tempo.", proof: "StableEnrich's official site lists six source groups with per-request prices; docs describe USDC payments and AgentCash usage.", components: [c("Enrichment source groups", ["People enrichment", "Web search", "Web scraping", "Places & Location", "Social Media Data", "Contact Information"], "High", "The official page lists these groups and prices."), c("Agent execution path", ["AgentCash MCP/CLI"], "High", "The official docs describe AgentCash paid fetch flow.")] },
  "merit-systems/stablecrypto/market-data": { label: "StableCrypto official x402 crypto-data API", website: "https://stablecrypto.dev/", docs: "https://stablecrypto.dev/llms.txt", pricing: "https://stablecrypto.dev/", price: "$0.01 per request across CoinGecko, DefiLlama, Alchemy, and Etherscan groups.", auth: "x402 / AgentCash paid HTTP flow; no provider API keys for the caller.", proof: "StableCrypto's official page lists four providers, 115 endpoints, and $0.01/request pricing.", components: [c("Crypto data source groups", ["CoinGecko", "DefiLlama", "Alchemy", "Etherscan"], "High", "The official page lists these four groups."), c("Endpoint pricing", ["$0.01 per request"], "High", "The official page says every request costs a penny.")] },
  "paysponge/2captcha": { label: "2Captcha API", website: "https://2captcha.com/", docs: "https://2captcha.com/api-docs", pricing: "https://2captcha.com/pricing", price: "Usage-based captcha solving; exact price depends on captcha type and current 2Captcha pricing.", auth: "2Captcha account, balance, and API key.", proof: "2Captcha publishes API documentation and pricing.", components: [c("Direct captcha-solving provider", ["2Captcha"], "High", "Official docs/pricing document the service."), c("Direct authentication", ["2Captcha API key", "prepaid balance"], "High", "Direct usage requires credentials and funded balance.")] },
  "paysponge/rentcast": { label: "RentCast API", website: "https://www.rentcast.io/", docs: "https://developers.rentcast.io/", pricing: "https://www.rentcast.io/pricing", price: "RentCast publishes API plans and usage limits on its pricing page.", auth: "RentCast account and API key.", proof: "RentCast official docs/pricing describe property-data API access.", components: [c("Direct property-data provider", ["RentCast API"], "High", "Official docs/pricing describe property records, rent estimates, and market data."), c("Direct authentication", ["RentCast API key"], "High", "Direct usage is key-based.")] },
  "paysponge/tripadvisor": { label: "Tripadvisor Content API", website: "https://www.tripadvisor.com/developers", docs: "https://tripadvisor-content-api.readme.io/", pricing: "https://www.tripadvisor.com/developers", price: "Commercial access is controlled through Tripadvisor developer/partner approval; no exact public price is claimed here.", auth: "Tripadvisor developer/partner account and API credentials.", proof: "Tripadvisor developer portal and Content API docs describe direct API access and approval-oriented onboarding.", components: [c("Direct travel content provider", ["Tripadvisor Content API"], "High", "Official developer docs describe direct access."), c("Direct authentication", ["Tripadvisor API credentials"], "High", "Direct API use requires developer credentials/approval.")] },
}

function alibaba(s: PayShService): SourceProfile {
  const common = {
    website: "https://www.alibabacloud.com/",
    docs: "https://www.alibabacloud.com/help",
    pricing: "https://www.alibabacloud.com/pricing",
    auth: "Alibaba Cloud account, service activation, billing setup, RAM/API credentials, and console configuration.",
    components: [c("Direct cloud provider", ["Alibaba Cloud"], "High", "The service slug/provider maps to Alibaba Cloud in the pay.sh catalog."), c("Direct account requirements", ["Alibaba Cloud account", "billing activation", "API credentials"], "High", "Direct Alibaba Cloud API usage requires account, billing, service activation, and credentials.")],
    score: 0.68,
  }
  if (s.slug.includes("green")) return { ...common, label: "Alibaba Cloud Content Moderation / AI Guardrails", docs: "https://www.alibabacloud.com/help/en/content-moderation/latest/synchronous-text-moderation", pricing: "https://www.alibabacloud.com/en/product/content-moderation/pricing", price: "Content Moderation publishes pay-as-you-go tiered pricing, commonly per 1,000 image/text/video tasks by scenario and region.", proof: "Alibaba Content Moderation pricing pages describe pay-as-you-go billing, tiers, content types, and regional pricing.", components: [c("Moderation engine", ["Alibaba Cloud Content Moderation", "AI Guardrails"], "High", "Official Alibaba docs document image/text/voice/video/document moderation and billing."), ...common.components] }
  if (s.slug.includes("contactcenterai")) return { ...common, label: "Alibaba Cloud Intelligent Speech Interaction / Contact Center AI family", docs: "https://www.alibabacloud.com/en/product/intelligent-speech-interaction", pricing: "https://www.alibabacloud.com/help/en/isi/product-overview/pricing", price: "Intelligent Speech Interaction lists pay-as-you-go prices such as STT/TTS billing by hour, thousand calls, or text length depending on feature.", proof: "Alibaba ISI pricing docs list billing items for speech recognition and synthesis; exact ContactCenterAI operation mapping still needs endpoint-level confirmation.", components: [c("Speech AI product family", ["Alibaba Cloud Intelligent Speech Interaction"], "Medium", "Official ISI docs verify speech recognition/synthesis pricing; exact ContactCenterAI mapping may vary."), ...common.components] }
  if (s.slug.includes("iqs")) return { ...common, label: "Alibaba Cloud Image Search", docs: "https://www.alibabacloud.com/help/en/image-search/product-overview/what-is-image-search", pricing: "https://www.alibabacloud.com/help/en/image-search/product-overview/pricing/", price: "Image Search billing is based on resource packages/instances, image capacity, and QPS according to official docs.", proof: "Alibaba Cloud Image Search billing docs describe capacity/QPS based subscription resource packages.", components: [c("Image search service", ["Alibaba Cloud Image Search"], "High", "Official Image Search docs describe visual/product/duplicate image search billing concepts."), ...common.components] }
  if (s.slug.includes("videoenhan")) return { ...common, label: "Alibaba Cloud ApsaraVideo / Video Enhancement", docs: "https://www.alibabacloud.com/help/en/mps/product-overview/audio-and-video-enhancement-fees", pricing: "https://www.alibabacloud.com/help/en/mps/product-overview/audio-and-video-enhancement-fees", price: "Audio/video enhancement pricing is pay-as-you-go by processed minutes or frames depending on feature, resolution, and region.", proof: "Alibaba audio/video enhancement billing docs list frame/minute based enhancement pricing and billing rules.", components: [c("Video enhancement billing family", ["ApsaraVideo Media Processing", "Video enhancement"], "Medium", "Official MPS docs verify enhancement billing; exact pay.sh operation mapping should be checked endpoint by endpoint."), ...common.components] }
  if (s.slug.includes("imageseg") || s.slug.includes("ivpd") || s.slug.includes("objectdet") || s.slug.includes("facebody")) return { ...common, label: "Alibaba Cloud image intelligence / visual AI family", docs: "https://www.alibabacloud.com/help/en/oss/user-guide/what-is-image-intelligent-in-imm/", pricing: "https://www.alibabacloud.com/pricing-calculator", price: "Direct pricing varies by visual-AI operation; Alibaba docs link image intelligence operations to related cloud-service billable items.", proof: "Alibaba docs describe image intelligence capabilities such as facial detection, body detection, vehicle detection, labels, and quality assessment with billing through related Alibaba services.", components: [c("Visual AI capability", ["Alibaba Cloud image intelligence", "IMM/OSS visual processing"], "Medium", "Official Alibaba docs verify visual intelligence capabilities; exact pricing differs by operation and region."), ...common.components] }
  if (s.slug.includes("ocr")) return { ...common, label: "Alibaba Cloud OCR / document recognition family", docs: "https://www.alibabacloud.com/help/en/content-moderation/latest/faq-about-ocr", pricing: "https://www.alibabacloud.com/pricing-calculator", price: "OCR direct pricing varies by product and operation; Alibaba docs describe OCR billing as tiered by daily call volume or product-family pricing.", proof: "Alibaba OCR-related docs describe OCR operations and refer pricing to official pricing pages/calculators.", components: [c("OCR capability", ["Alibaba Cloud OCR", "VIAPI-OCR"], "Medium", "Official Alibaba docs verify OCR capabilities and billing references; exact operation pricing should be confirmed per endpoint."), ...common.components] }
  return { ...common, label: "Alibaba Cloud console/API", price: "Direct pricing varies by product family, region, usage metric, and billing mode.", proof: "Alibaba Cloud publishes product docs, billing pages, and pricing calculators for direct usage." }
}

function sourceFor(s: PayShService): SourceProfile {
  if (exact[s.slug]) return exact[s.slug]
  if (s.provider === "Alibaba Cloud" || s.slug.includes("/alibaba/")) return alibaba(s)
  if (s.slug.includes("/google/vision")) return { label: "Google Cloud Vision API", website: "https://cloud.google.com/vision", docs: "https://cloud.google.com/vision/docs", pricing: "https://cloud.google.com/vision/pricing", price: "Google Cloud Vision uses usage-based feature pricing by image/unit.", auth: "Google Cloud project, billing account, and API credentials for direct use.", proof: "Google Cloud publishes Vision API docs and pricing for direct API access.", components: [c("Direct API provider", ["Google Cloud Vision API"], "High", "Official Google Cloud docs/pricing document Vision API."), c("Direct authentication", ["Google Cloud project", "API credentials", "billing account"], "High", "Direct Google APIs require project credentials and billing setup.")] }
  if (s.slug.includes("/google/translate")) return { label: "Google Cloud Translation API", website: "https://cloud.google.com/translate", docs: "https://cloud.google.com/translate/docs", pricing: "https://cloud.google.com/translate/pricing", price: "Google Cloud Translation uses usage-based character/document pricing by edition and feature.", auth: "Google Cloud project, billing account, and API credentials for direct use.", proof: "Google Cloud publishes Translation API docs and pricing for direct API access.", components: [c("Direct API provider", ["Google Cloud Translation API"], "High", "Official Google Cloud docs/pricing document Translation API."), c("Direct authentication", ["Google Cloud project", "API credentials", "billing account"], "High", "Direct Google APIs require project credentials and billing setup.")] }
  if (s.slug.includes("/google/texttospeech")) return { label: "Google Cloud Text-to-Speech API", website: "https://cloud.google.com/text-to-speech", docs: "https://cloud.google.com/text-to-speech/docs", pricing: "https://cloud.google.com/text-to-speech/pricing", price: "Google Cloud Text-to-Speech uses usage-based character pricing by voice/model class.", auth: "Google Cloud project, billing account, and API credentials for direct use.", proof: "Google Cloud publishes Text-to-Speech docs and pricing for direct API access.", components: [c("Direct API provider", ["Google Cloud Text-to-Speech API"], "High", "Official Google Cloud docs/pricing document Text-to-Speech API."), c("Direct authentication", ["Google Cloud project", "API credentials", "billing account"], "High", "Direct Google APIs require project credentials and billing setup.")] }
  if (s.slug.includes("/google/speech")) return { label: "Google Cloud Speech-to-Text API", website: "https://cloud.google.com/speech-to-text", docs: "https://cloud.google.com/speech-to-text/docs", pricing: "https://cloud.google.com/speech-to-text/pricing", price: "Google Cloud Speech-to-Text uses usage-based audio duration pricing by model/feature.", auth: "Google Cloud project, billing account, and API credentials for direct use.", proof: "Google Cloud publishes Speech-to-Text docs and pricing for direct API access.", components: [c("Direct API provider", ["Google Cloud Speech-to-Text API"], "High", "Official Google Cloud docs/pricing document Speech-to-Text API."), c("Direct authentication", ["Google Cloud project", "API credentials", "billing account"], "High", "Direct Google APIs require project credentials and billing setup.")] }
  if (s.slug.includes("/google/documentai")) return { label: "Google Cloud Document AI", website: "https://cloud.google.com/document-ai", docs: "https://cloud.google.com/document-ai/docs", pricing: "https://cloud.google.com/document-ai/pricing", price: "Google Cloud Document AI uses usage-based page/processor pricing by feature.", auth: "Google Cloud project, billing account, and API credentials for direct use.", proof: "Google Cloud publishes Document AI docs and pricing for direct API access.", components: [c("Direct API provider", ["Google Cloud Document AI"], "High", "Official Google Cloud docs/pricing document Document AI."), c("Direct authentication", ["Google Cloud project", "API credentials", "billing account"], "High", "Direct Google APIs require project credentials and billing setup.")] }
  return { label: "Only verified on pay.sh", website: s.paysh_url, docs: s.paysh_url, price: "No external official source was verified for this service. The verified source is the pay.sh catalog listing only.", auth: "Wallet-paid HTTP access through pay.sh. External provider auth is unverified.", proof: "The public pay.sh catalog verifies that this service is available through pay.sh; no external official provider page is claimed.", score: 0.5, components: fallbackComponents(s) }
}

function evidenceFor(s: PayShService, p: SourceProfile): Evidence[] {
  const ev: Evidence[] = [{ title: "pay.sh live catalog", url: PAYSH, proves: `pay.sh lists ${s.name} at ${s.slug} with ${s.endpoints} endpoint(s) and ${s.paysh_price_label} pricing.`, confidenceScore: 0.95 }]
  const url = p.pricing ?? p.docs ?? p.website
  if (url && url !== PAYSH) ev.push({ title: `${p.label} official source`, url, proves: p.proof, confidenceScore: p.score ?? 0.86 })
  if (p.github) ev.push({ title: `${p.label} source repository`, url: p.github, proves: "Public source repository connected to this service family.", confidenceScore: 0.78 })
  return ev
}

function comparisonFor(s: PayShService, p: SourceProfile): ComparisonMatrix {
  const direct = Boolean(p.pricing && p.pricing !== PAYSH)
  const noKeys = p.auth.toLowerCase().includes("no api keys") || p.auth.toLowerCase().includes("no-key")
  const noAccounts = p.auth.toLowerCase().includes("no accounts") || p.auth.toLowerCase().includes("no-account")
  return {
    payShX402Usage: `Use pay.sh when an agent needs ${s.name} through a wallet-paid catalog entry with no separate service account in the agent flow.`,
    directProviderUsage: direct ? `Use ${p.label} directly when you want provider-native billing, limits, dashboard, and credentials.` : `No provider-native comparison is claimed yet because no separate official direct source has been verified for ${s.name}.`,
    setupFriction: direct ? "pay.sh minimizes signup/key/billing setup for agents; direct use gives more provider-native control after onboarding." : "pay.sh is the verified path in this profile; direct setup friction is intentionally unclaimed until official source evidence is added.",
    apiKeyRequired: direct && !noKeys ? "Yes" : "No",
    accountRequired: direct && !noAccounts ? "Yes" : "No",
    billingRequired: direct && !noAccounts ? "Yes" : "No",
    agentFriendliness: "pay.sh is strongest for discovery and per-request wallet access; direct providers can be better for high-volume production control once onboarded.",
    bestUseCase: s.best_for,
  }
}

function seed(s: PayShService): ServiceResearchSeed {
  const p = sourceFor(s)
  const sourceUrl = p.pricing ?? p.docs ?? p.website ?? PAYSH
  return {
    slug: s.slug,
    name: s.name,
    category: s.category,
    payShPrice: s.paysh_price_label,
    knownDirectSource: p.label,
    officialUrls: { website: p.website, docs: p.docs, pricing: p.pricing, github: p.github },
    officialOffer: { label: p.label, price: p.price, auth: p.auth, sourceUrl, notes: p.proof },
    payShOffer: { label: "pay.sh catalog offer", price: `${s.paysh_price_label} across ${s.endpoints} endpoint(s)`, auth: "Wallet-paid HTTP access through pay.sh/x402-style payment flow.", sourceUrl: PAYSH, notes: `pay.sh metadata: category ${s.category}, status ${s.status}, provider ${s.provider}.` },
    evidence: evidenceFor(s, p),
    probableInfra: p.components,
    comparison: comparisonFor(s, p),
    notes: `Research profile for ${s.name}. Only source-backed claims are shown. Evidence scores are estimated research-strength signals, not audited accuracy guarantees.`,
  }
}

export function buildResearchSeedFromService(service: PayShService): ServiceResearchSeed { return seed(service) }

export const SERVICE_RESEARCH_SEEDS: ServiceResearchSeed[] = PAYSH_SERVICES.map(seed)

export function inferDirectProvider(service: ServiceResearchSeed): string { return service.knownDirectSource ?? "Direct provider not confirmed" }
export function calculateConfidence(evidence: Evidence[]): Confidence {
  if (evidence.length === 0) return "Low"
  const avg = evidence.reduce((sum, item) => sum + item.confidenceScore, 0) / evidence.length
  if (avg >= 0.8) return "High"
  if (avg >= 0.55) return "Medium"
  return "Low"
}
export function comparePayShVsDirect(service: ServiceResearchSeed): ComparisonMatrix { return service.comparison }
export function generateResearchReport(service: ServiceResearchSeed): ServiceResearchSeed & { inferredProvider: string; confidence: Confidence } {
  return { ...service, inferredProvider: inferDirectProvider(service), confidence: calculateConfidence(service.evidence) }
}




