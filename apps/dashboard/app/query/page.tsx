"use client"

import { useMemo, useState } from "react"
import { Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js"
import type { PayShCategory, PayShService } from "../../../../data/paysh-services"

const categories: Array<"all" | PayShCategory> = [
  "all",
  "AI/ML",
  "Media",
  "Data",
  "Compute",
  "Storage",
  "Search",
  "Messaging",
  "Crypto/Finance",
  "Maps",
  "Other",
]

type ResearchProfile = {
  slug: string
  name: string
  knownDirectSource?: string
  officialUrls: { website?: string; docs?: string; pricing?: string; github?: string }
  officialOffer?: { label: string; price: string; auth: string; sourceUrl: string; notes: string }
  payShOffer?: { label: string; price: string; auth: string; sourceUrl: string; notes: string }
  evidence: Array<{ title: string; url: string; proves: string; confidenceScore: number }>
  probableInfra: Array<{ component: string; likelyProviderCandidates: string[]; confidence: "High" | "Medium" | "Low"; rationale: string }>
  comparison: {
    payShX402Usage: string
    directProviderUsage: string
    setupFriction: string
    apiKeyRequired: "Yes" | "No" | "Sometimes"
    accountRequired: "Yes" | "No" | "Sometimes"
    billingRequired: "Yes" | "No" | "Sometimes"
    agentFriendliness: string
    bestUseCase: string
  }
  notes: string
  inferredProvider: string
  confidence: "High" | "Medium" | "Low"
}

type SourcedService = PayShService & {
  research_profile?: ResearchProfile
  source_metadata?: {
    source_mode: "live" | "fallback"
    source_status: "verified" | "failed"
    pay_sh_source: string
    last_checked_at: string
    confidence: "high" | "medium" | "low" | "unknown"
    warning?: string
    direct_source: string | null
    direct_source_status: "verified" | "unavailable"
    source_note?: string
  }
}

type WalletNetwork = "devnet" | "mainnet-beta"

type PhantomProvider = {
  isPhantom?: boolean
  publicKey?: PublicKey
  connect: () => Promise<{ publicKey: PublicKey }>
  signTransaction?: (transaction: Transaction) => Promise<Transaction>
  signAndSendTransaction?: (transaction: Transaction) => Promise<{ signature: string }>
}

declare global {
  interface Window {
    solana?: PhantomProvider
  }
}

const QUERY_PRICE_SOL = 0.001
const RECEIVER_WALLET = process.env.NEXT_PUBLIC_RECEIVER_WALLET ?? ""
const RPC_BY_NETWORK: Record<WalletNetwork, string> = {
  devnet: "https://api.devnet.solana.com",
  "mainnet-beta": "https://api.mainnet-beta.solana.com",
}

interface AgentQueryResponse {
  success: boolean
  status: number
  data?: PayShIntelligenceResult
  txSignature?: string
  walletAddress?: string
  error?: string
}

interface PayShIntelligenceResult {
  generated_at: string
  total_services: number
  total_categories: number
  query: {
    category: string
    service: string
    compare: boolean
  }
  summary: {
    avg_savings_low_volume: string
    services_with_free_tier: number
    most_valuable_for_agents: string[]
    total_direct_monthly_cost: number
    total_direct_monthly_cost_label?: string
    services_with_verified_direct_source?: number
    total_paysh_equivalent: string
  }
  services: SourcedService[]
  source?: {
    mode: "live" | "fallback"
    pay_sh_source: string
    warning: string | null
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function shortAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}

function dollars(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value)
}

function savingsPercent(service: PayShService): number {
  const direct = service.direct_cost_monthly
  if (direct <= 0) return service.paysh_price_min === 0 ? 100 : 50
  const monthlyPayShAtTen = service.paysh_price_max * 10
  return Math.max(0, Math.min(99, Math.round(((direct - monthlyPayShAtTen) / direct) * 100)))
}

function savingsBadge(service: PayShService): { label: string; className: string } {
  const percent = savingsPercent(service)
  if (percent > 80) return { label: `${percent}%`, className: "stat-badge badge-green" }
  if (percent >= 50) return { label: `${percent}%`, className: "stat-badge badge-yellow" }
  return { label: `${percent}%`, className: "stat-badge badge-gray" }
}

function explorerUrl(signature?: string): string {
  return signature ? `https://explorer.solana.com/tx/${signature}?cluster=devnet` : "https://explorer.solana.com/?cluster=devnet"
}

export default function QueryPage() {
  const [category, setCategory] = useState<"all" | PayShCategory>("all")
  const [loading, setLoading] = useState(false)
  const [terminalLines, setTerminalLines] = useState<string[]>([])
  const [result, setResult] = useState<AgentQueryResponse | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [network, setNetwork] = useState<WalletNetwork>("devnet")
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const [walletError, setWalletError] = useState<string | null>(null)

  const filteredServices = useMemo(() => {
    const services = result?.data?.services ?? []

    return [...services]
      .filter((service) => category === "all" || service.category === category)
      .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
  }, [result, category])


  async function refreshBalance(address: string, selectedNetwork = network): Promise<number> {
    const connection = new Connection(RPC_BY_NETWORK[selectedNetwork], "confirmed")
    const lamports = await connection.getBalance(new PublicKey(address))
    const balance = lamports / LAMPORTS_PER_SOL
    setWalletBalance(balance)
    return balance
  }

  async function connectWallet(): Promise<void> {
    setWalletError(null)
    if (typeof window === "undefined" || !window.solana?.isPhantom) {
      setWalletError("Phantom wallet was not found. Install Phantom, switch it to devnet, then retry.")
      return
    }

    try {
      const response = await window.solana.connect()
      const address = response.publicKey.toBase58()
      setWalletAddress(address)
      await refreshBalance(address)
    } catch (error) {
      setWalletError(error instanceof Error ? error.message : "Wallet connection was rejected.")
    }
  }

  async function payWithConnectedWallet(): Promise<string> {
    if (!walletAddress) throw new Error("Connect your wallet before running the agent query.")
    if (!RECEIVER_WALLET) throw new Error("NEXT_PUBLIC_RECEIVER_WALLET is missing. Add your receiver wallet and restart the dashboard.")
    if (network !== "devnet") throw new Error("Mainnet is shown for production planning, but this demo only sends devnet SOL.")
    if (!window.solana) throw new Error("Phantom wallet is not available.")

    const connection = new Connection(RPC_BY_NETWORK[network], "confirmed")
    const fromPubkey = new PublicKey(walletAddress)
    const toPubkey = new PublicKey(RECEIVER_WALLET)
    const balance = await refreshBalance(walletAddress, network)
    const required = QUERY_PRICE_SOL + 0.00001

    if (balance < required) {
      throw new Error(`Insufficient devnet SOL. Your wallet has ${balance.toFixed(5)} SOL, but the query needs ${QUERY_PRICE_SOL} SOL plus a small network fee. Use the Solana devnet faucet and retry.`)
    }

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports: Math.round(QUERY_PRICE_SOL * LAMPORTS_PER_SOL),
      }),
    )
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed")
    transaction.recentBlockhash = blockhash
    transaction.feePayer = fromPubkey

    let signature: string
    if (window.solana.signAndSendTransaction) {
      const result = await window.solana.signAndSendTransaction(transaction)
      signature = result.signature
    } else if (window.solana.signTransaction) {
      const signed = await window.solana.signTransaction(transaction)
      signature = await connection.sendRawTransaction(signed.serialize())
    } else {
      throw new Error("Your wallet does not support transaction signing in this browser.")
    }

    await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed")
    await refreshBalance(walletAddress, network)
    return signature
  }
  async function runQuery(): Promise<void> {
    setWalletError(null)
    setResult(null)
    setExpanded(null)
    setTerminalLines([])

    if (!walletAddress) {
      setWalletError("Connect your wallet first. The agent query button unlocks after wallet connection.")
      return
    }

    setLoading(true)

    try {
      const stagedLines = [
        "Agent initializing with connected wallet...",
        `Wallet: ${shortAddress(walletAddress)} on ${network}`,
        "Calling protected API for x402 payment requirements...",
      ]

      for (const line of stagedLines) {
        setTerminalLines((current) => [...current, line])
        await sleep(360)
      }

      const requirementResponse = await fetch("/api/payment-requirement?category=all")
      if (requirementResponse.status !== 402) {
        const text = await requirementResponse.text()
        throw new Error(`x402 challenge failed. Expected HTTP 402 but received ${requirementResponse.status}. ${text}`)
      }
      const requirement = await requirementResponse.json() as { amount?: string; asset?: string; network?: string; payTo?: string }

      setTerminalLines((current) => [
        ...current,
        `Server responded: 402 Payment Required (${requirement.amount ?? QUERY_PRICE_SOL} ${requirement.asset ?? "SOL"})`,
        "Checking wallet balance before signing...",
      ])
      await sleep(360)

      const txSignature = await payWithConnectedWallet()
      setTerminalLines((current) => [
        ...current,
        `Payment confirmed! ${QUERY_PRICE_SOL} SOL sent`,
        `TX: ${txSignature}`,
        "Fetching PayShield intelligence report...",
      ])

      const intelligenceResponse = await fetch("/api/paysh-intelligence?category=all")
      const data = await intelligenceResponse.json() as PayShIntelligenceResult
      if (!intelligenceResponse.ok) {
        throw new Error(`Report fetch failed after payment: ${intelligenceResponse.status}`)
      }

      setResult({ success: true, status: 200, data, txSignature, walletAddress })
      setTerminalLines((current) => [...current, `Found ${data.services.length} services. Rendering report...`])
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown wallet/x402 error."
      setWalletError(message)
      setResult({ success: false, status: 500, error: message })
      setTerminalLines((current) => [...current, `Query failed: ${message}`])
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="hero-gradient">
      <div className="page-shell">
        <header className="top-nav">
  <a href="/" className="brand">
    <h1>PayShield</h1>
    <p>x402 intelligence gateway for pay.sh</p>
  </a>

  <div className="nav-links">
    <a
      href="https://github.com/maitri-vv/Payshield"
      target="_blank"
      rel="noopener noreferrer"
    >
      github
    </a>
  </div>
</header>

        <section className="glass-card wallet-panel">
          <div>
            <span className="stat-badge badge-purple">User wallet mode</span>
            <h2>Connect wallet to run the paid agent query</h2>
            <p>
              The report costs 0.001 SOL on devnet. Category buttons below only filter the report after one paid query,
              so the price is the same whether you view all services or one category.
            </p>
          </div>
          <div className="wallet-controls">
            <label>
              Network
              <select value={network} onChange={(event) => setNetwork(event.target.value as WalletNetwork)} disabled={loading}>
                <option value="devnet">Devnet demo</option>
                <option value="mainnet-beta">Mainnet production preview</option>
              </select>
            </label>
            <button className="btn-secondary" type="button" onClick={connectWallet} disabled={loading}>
              {walletAddress ? shortAddress(walletAddress) : "Connect Phantom"}
            </button>
            {walletAddress && (
              <div className="wallet-meta">
                <span>{walletBalance === null ? "Balance loading" : `${walletBalance.toFixed(4)} SOL`}</span>
                <button className="inline-expand" type="button" onClick={() => refreshBalance(walletAddress)} disabled={loading}>Refresh</button>
              </div>
            )}
          </div>
          {network === "mainnet-beta" && (
            <div className="notice-box warning">Mainnet is shown for production planning. This hackathon demo intentionally sends devnet SOL only.</div>
          )}
          {walletError && <div className="notice-box error">{walletError}</div>}
        </section>

        <section className="glass-card filter-bar report-filter-bar">
          <div className="chip-group">
            {categories.map((item) => (
              <button key={item} className={`chip ${category === item ? "active" : ""}`} onClick={() => setCategory(item)}>
                {item === "all" ? "All" : item}
              </button>
            ))}
          </div>
          <button className="btn-primary" onClick={runQuery} disabled={loading || !walletAddress || network !== "devnet"}>
            {walletAddress ? "Run Agent Query" : "Connect Wallet First"}
          </button>
        </section>

        {(terminalLines.length > 0 || loading) && (
          <section className="terminal-box">
            <div className="terminal-header">
              <span className="dot-red" />
              <span className="dot-yellow" />
              <span className="dot-green" />
            </div>
            <div className="terminal-body">
              {terminalLines.map((line, index) => (
                <div key={`${line}-${index}`}>{line}</div>
              ))}
              {loading && <span className="terminal-cursor" />}
            </div>
          </section>
        )}

        {result?.data && (
          <>
            <div style={{ margin: "0 0 18px" }}>
              <span className={`stat-badge ${result.data.source?.mode === "live" ? "badge-green" : "badge-yellow"}`}>
                {result.data.source?.mode === "live" ? "Live pay.sh catalog" : "Fallback catalog"}
              </span>
              <span style={{ color: "var(--text-secondary)", marginLeft: 10 }}>
                {result.data.source?.warning ? result.data.source.warning : "Prices fetched from the public pay.sh catalog for this query."}
              </span>
            </div>
            <section className="summary-grid">
              <div className="glass-card stat-card">
                <span>Report Scope</span>
                <strong>{category === "all" ? "All services" : category}</strong>
                <small style={{ color: "var(--text-dim)" }}>{filteredServices.length} shown from {result.data.services.length} fetched</small>
              </div>
              <div className="glass-card stat-card">
                <span>Agent Query Price</span>
                <strong>0.001 SOL</strong>
                <small style={{ color: "var(--text-dim)" }}>same price for all or any category filter</small>
              </div>
              <div className="glass-card stat-card">
                <span>Research Coverage</span>
                <strong>{filteredServices.filter((service) => service.research_profile).length}/{filteredServices.length}</strong>
                <small style={{ color: "var(--text-dim)" }}>expanded rows include source notes</small>
              </div>
              <div className="glass-card stat-card">
                <span>Catalog Source</span>
                <strong>{result.data.source?.mode === "live" ? "Live" : "Fallback"}</strong>
                <small style={{ color: "var(--text-dim)" }}>pay.sh public catalog</small>
              </div>
            </section>

            <section className="glass-card table-card">
              <table className="services-table">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Category</th>
                    <th>pay.sh Price</th>
                    <th>Verified Source</th>
                    <th>Status</th>
                    <th>Research</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredServices.map((service) => {
                    const isExpanded = expanded === service.id
                    const officialUrl = service.research_profile?.officialOffer?.sourceUrl
                    const hasExternalSource = Boolean(officialUrl && !officialUrl.includes("pay.sh"))

                    return (
                      <>
                        <tr key={service.id} onClick={() => setExpanded(isExpanded ? null : service.id)}>
                          <td>
                            <strong>{service.name}</strong>
                            <div style={{ color: "var(--text-dim)", marginTop: 4 }}>{service.slug}</div>
                            {service.research_profile && (
                              <div style={{ marginTop: 8 }}>
                                <span className="stat-badge badge-purple">Research profile</span>
                              </div>
                            )}
                          </td>
                          <td><span className="stat-badge badge-cyan">{service.category}</span></td>
                          <td>{service.paysh_price_label}</td>
                          <td>
                            {hasExternalSource && officialUrl ? (
                              <a href={officialUrl} target="_blank" rel="noreferrer">
                                {service.research_profile?.knownDirectSource ?? "Official source"}
                              </a>
                            ) : (
                              <a href={service.paysh_url} target="_blank" rel="noreferrer">pay.sh listing</a>
                            )}
                          </td>
                          <td>
                            <span className={`stat-badge ${hasExternalSource ? "badge-green" : "badge-yellow"}`}>
                              {hasExternalSource ? "official mapped" : "pay.sh only"}
                            </span>
                          </td>
                          <td>
                            <button className="inline-expand" type="button">
                              {isExpanded ? "Hide details" : "View source notes"}
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="details-row">
                            <td colSpan={6}>
                              <div className="details-grid">
                                <div>
                                  <strong>Description</strong>
                                  <p>{service.description}</p>
                                </div>
                                <div>
                                  <strong>Models included</strong>
                                  <p>{service.models_included.join(", ")}</p>
                                </div>
                                <div>
                                  <strong>Source status</strong>
                                  <p>
                                    {hasExternalSource && officialUrl ? (
                                      <>
                                        Official source: <a href={officialUrl} target="_blank" rel="noreferrer">{officialUrl}</a>
                                      </>
                                    ) : (
                                      "Only verified on pay.sh for now; no external official source is claimed."
                                    )}
                                  </p>
                                  <p>{service.source_metadata?.source_note ?? service.paysh_advantage}</p>
                                  <p>{service.research_profile ? "Research profile available for this service." : "Research profile not seeded yet. Add this slug to services.seed.ts to map evidence and probable infra."}</p>
                                </div>

                                {service.research_profile && (
                                  <div style={{ gridColumn: "1 / -1", marginTop: 16 }}>
                                    <div className="research-shell">
                                      <div className="research-header">
                                        <div>
                                          <span className="stat-badge badge-purple">Research profile</span>
                                          <h3>{service.research_profile.name}</h3>
                                          <p>{service.research_profile.notes}</p>
                                        </div>
                                        <span className={`stat-badge ${service.research_profile.confidence === "High" ? "badge-green" : service.research_profile.confidence === "Medium" ? "badge-yellow" : "badge-gray"}`}>
                                          {service.research_profile.confidence} confidence
                                        </span>
                                      </div>

                                      {(service.research_profile.officialOffer || service.research_profile.payShOffer) && (
                                        <div className="offer-compare">
                                          <div>
                                            <span>{hasExternalSource ? "Official external source" : "External source status"}</span>
                                            <h4>{service.research_profile.officialOffer?.label ?? "Official source"}</h4>
                                            <p>{service.research_profile.officialOffer?.price ?? "No official price captured"}</p>
                                            <p>{service.research_profile.officialOffer?.auth ?? "Auth not mapped"}</p>
                                            {service.research_profile.officialOffer?.sourceUrl && <a href={service.research_profile.officialOffer.sourceUrl} target="_blank" rel="noreferrer">{hasExternalSource ? "Verify on official site" : "Verify pay.sh listing"}</a>}
                                            <small>{service.research_profile.officialOffer?.notes}</small>
                                          </div>
                                          <div>
                                            <span>pay.sh catalog offer</span>
                                            <h4>{service.research_profile.payShOffer?.label ?? "pay.sh source"}</h4>
                                            <p>{service.research_profile.payShOffer?.price ?? service.paysh_price_label}</p>
                                            <p>{service.research_profile.payShOffer?.auth ?? "pay.sh payment flow"}</p>
                                            {service.research_profile.payShOffer?.sourceUrl && <a href={service.research_profile.payShOffer.sourceUrl} target="_blank" rel="noreferrer">Verify on pay.sh</a>}
                                            <small>{service.research_profile.payShOffer?.notes}</small>
                                          </div>
                                        </div>
                                      )}

                                      <div className="research-grid">
                                        <div className="research-panel">
                                          <strong>Service profile</strong>
                                          <dl className="research-list">
                                            <div><dt>Service name</dt><dd>{service.research_profile.name}</dd></div>
                                            <div><dt>Category</dt><dd>{service.category}</dd></div>
                                            <div><dt>pay.sh slug</dt><dd>{service.slug}</dd></div>
                                            <div><dt>pay.sh price</dt><dd>{service.paysh_price_label}</dd></div>
                                            <div><dt>Auth method</dt><dd>x402 wallet payment through pay.sh</dd></div>
                                            <div><dt>Known direct source</dt><dd>{service.research_profile.knownDirectSource ?? "External source unverified"}</dd></div>
                                          </dl>
                                        </div>

                                        <div className="research-panel">
                                          <strong>Source URLs</strong>
                                          <dl className="research-list">
                                            <div><dt>Website</dt><dd>{service.research_profile.officialUrls.website ? <a href={service.research_profile.officialUrls.website} target="_blank" rel="noreferrer">{service.research_profile.officialUrls.website}</a> : "Not mapped"}</dd></div>
                                            <div><dt>Docs</dt><dd>{service.research_profile.officialUrls.docs ? <a href={service.research_profile.officialUrls.docs} target="_blank" rel="noreferrer">{service.research_profile.officialUrls.docs}</a> : "Not mapped"}</dd></div>
                                            <div><dt>Pricing</dt><dd>{service.research_profile.officialUrls.pricing ? <a href={service.research_profile.officialUrls.pricing} target="_blank" rel="noreferrer">{service.research_profile.officialUrls.pricing}</a> : "No public direct pricing page confirmed"}</dd></div>
                                            <div><dt>Source repo</dt><dd>{service.research_profile.officialUrls.github ? <a href={service.research_profile.officialUrls.github} target="_blank" rel="noreferrer">{service.research_profile.officialUrls.github}</a> : "Not mapped"}</dd></div>
                                          </dl>
                                        </div>
                                      </div>

                                      <div className="research-section">
                                        <strong>Verified Architecture From Sources</strong>
                                        <div className="mini-table">
                                          {service.research_profile.probableInfra.map((item) => (
                                            <div className="mini-row" key={item.component}>
                                              <span>{item.component}</span>
                                              <span>{item.likelyProviderCandidates.join(", ")}<small>{item.rationale}</small></span>
                                              <span className={`stat-badge ${item.confidence === "High" ? "badge-green" : item.confidence === "Medium" ? "badge-yellow" : "badge-gray"}`}>{item.confidence}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                                      <div className="research-section">
                                        <strong>Comparison Matrix</strong>
                                        <div className="comparison-grid">
                                          <div><span>pay.sh/x402 usage</span><p>{service.research_profile.comparison.payShX402Usage}</p></div>
                                          <div><span>Direct provider usage</span><p>{service.research_profile.comparison.directProviderUsage}</p></div>
                                          <div><span>Setup friction</span><p>{service.research_profile.comparison.setupFriction}</p></div>
                                          <div><span>API key required?</span><p>{service.research_profile.comparison.apiKeyRequired}</p></div>
                                          <div><span>Account required?</span><p>{service.research_profile.comparison.accountRequired}</p></div>
                                          <div><span>Billing required?</span><p>{service.research_profile.comparison.billingRequired}</p></div>
                                          <div><span>Agent-friendliness</span><p>{service.research_profile.comparison.agentFriendliness}</p></div>
                                          <div><span>Best use case</span><p>{service.research_profile.comparison.bestUseCase}</p></div>
                                        </div>
                                      </div>

                                      <div className="research-section">
                                        <strong>Research Evidence <small>(scores are estimated research strength, not audited truth)</small></strong>
                                        <div className="mini-table evidence-table">
                                          {service.research_profile.evidence.map((item) => (
                                            <div className="mini-row" key={item.url}>
                                              <span><a href={item.url} target="_blank" rel="noreferrer">{item.title}</a></span>
                                              <span>{item.proves}</span>
                                              <span className="stat-badge badge-cyan">est. {Math.round(item.confidenceScore * 100)}/100</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })}
                </tbody>
              </table>
            </section>

            <div style={{ marginTop: 18 }}>
              <button className="btn-secondary" onClick={() => window.open(explorerUrl(result.txSignature), "_blank", "noopener,noreferrer")}>
                Verify Payment
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  )
}






















