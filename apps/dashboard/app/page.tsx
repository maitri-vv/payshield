import Link from "next/link"

const GITHUB_URL = "https://github.com/maitri-vv/Payshield"

const STATS = [
  { value: "75+", label: "pay.sh services covered" },
  { value: "0.001", label: "SOL per query" },
  { value: "0", label: "accounts needed" },
  { value: "∞", label: "time saved" },
]

const WHY_CARDS = [
  {
    title: "Hours to seconds",
    desc: "Researching 75 pay.sh services manually takes hours. PayShield turns it into one agent-readable intelligence call.",
  },
  {
    title: "Live, not cached",
    desc: "PayShield avoids hardcoded competitor pricing. It points to provider-owned pricing pages so the source remains verifiable.",
  },
  {
    title: "Agent-native by design",
    desc: "Built around x402-style machine payments. An agent pays, fetches, and receives the report without subscription setup.",
  },
  {
    title: "Source-linked output",
    desc: "pay.sh prices are quoted directly, while alternatives are linked to their own official pricing or product pages.",
  },
]

const STEPS = [
  {
    num: "01",
    title: "Connect Phantom",
    desc: "Open the query console and connect your Phantom wallet on Solana devnet.",
  },
  {
    num: "02",
    title: "Run agent query",
    desc: "The agent calls the protected PayShield API and receives an HTTP 402 payment requirement.",
  },
  {
    num: "03",
    title: "Pay 0.001 SOL",
    desc: "Your wallet signs a Solana devnet transfer and the transaction confirms on-chain.",
  },
  {
    num: "04",
    title: "Receive report",
    desc: "PayShield returns structured intelligence for pay.sh services with direct alternative links.",
  },
]

const SAMPLE_SERVICES = [
  { name: "StableStudio", category: "Media", paysh: "$0.01–$20.00/req", direct: "OpenAI Pro $200/mo", saving: "95%" },
  { name: "QuickNode RPC", category: "Compute", paysh: "$0.001/req", direct: "QuickNode $49/mo", saving: "Pay per call" },
  { name: "StableCrypto", category: "Crypto/Finance", paysh: "$0.01/req", direct: "CoinGecko $129/mo", saving: "99%" },
  { name: "Perplexity AI", category: "AI/ML", paysh: "$0.01/req", direct: "Perplexity Pro $20/mo", saving: "99%" },
  { name: "fal.ai", category: "Media", paysh: "$0.01–$0.07/img", direct: "fal.ai plan $10/mo", saving: "~80%" },
]

export default function LandingPage() {
  return (
    <main className="hero-gradient">
      <div className="page-shell">
        <nav className="top-nav">
          <Link href="/" className="brand">
            <h1>PayShield</h1>
            <p>x402 intelligence gateway for pay.sh</p>
          </Link>

          <div className="nav-links">
            <a href="#about">about</a>
            <a href="#flow">flow</a>
            <a href="#report">report</a>
            <a href="#why">why</a>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
              github
            </a>
            <Link href="/query" className="btn-primary nav-cta">
              Run Agent Query
            </Link>
          </div>
        </nav>

        <section className="landing-section">
          <div className="landing-kicker">
            Built on pay.sh · Powered by x402 · Solana devnet
          </div>

          <h2>
            Stop manually researching
            <br />
            <span>75 pay.sh services.</span>
          </h2>

          <p>
            Connect your Phantom wallet. Pay one tiny 0.001 SOL micropayment via x402.
            Get a complete, structured, source-linked intelligence report on every pay.sh
            service - what it costs, what it replaces, and how much you save.
          </p>

          <div className="landing-actions">
            <Link href="/query" className="btn-primary">
              Run Agent Query
            </Link>
            <a
              href="https://pay.sh"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              What is pay.sh?
            </a>
          </div>
        </section>

        <section className="summary-grid">
          {STATS.map((s) => (
            <div key={s.label} className="glass-card stat-card">
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </div>
          ))}
        </section>

        <section id="about" className="glass-card content-card">
          <div className="two-col">
            <div>
              <div className="eyebrow">About pay.sh</div>
              <h3>The API gateway for AI agents</h3>
              <p>
                pay.sh gives AI agents access to premium APIs without sign-up,
                accounts, credit cards, or subscriptions. PayShield sits beside
                that idea as an intelligence layer for comparing pay.sh services
                against direct provider alternatives.
              </p>

              <div className="tag-row">
                {["No accounts", "No credit cards", "Pay per request", "75+ APIs", "x402 protocol", "Solana native"].map((t) => (
                  <span key={t} className="stat-badge badge-gray">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="terminal-box">
              <div className="terminal-header">
                <span className="dot-red" />
                <span className="dot-yellow" />
                <span className="dot-green" />
              </div>
              <div className="terminal-body">
                <div>$ pay.sh service lookup</div>
                <div>fetching catalog...</div>
                <div>matching direct alternatives...</div>
                <div>checking official pricing links...</div>
                <div className="terminal-success">report ready</div>
                <span className="terminal-cursor" />
              </div>
            </div>
          </div>
        </section>

        <section id="flow" className="section-block">
          <h3>How it works</h3>
          <p>Four steps. One payment. Complete intelligence.</p>

          <div className="steps-grid">
            {STEPS.map((s) => (
              <div key={s.num} className="glass-card step-card">
                <span>{s.num}</span>
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="glass-card flow-card">
            <div className="eyebrow">x402 payment flow</div>
            <div className="flow-lines">
              <div><span>→</span><p>Agent calls GET /api/paysh-intelligence</p></div>
              <div><span>←</span><p>Server returns 402 payment requirement</p></div>
              <div><span>→</span><p>Agent signs Solana transfer and confirms on-chain</p></div>
              <div><span>→</span><p>Agent retries with X-Payment transaction proof</p></div>
              <div><span>←</span><p>Server verifies and returns the 75-service report</p></div>
            </div>
          </div>
        </section>

        <section id="report" className="section-block">
          <h3>Sample intelligence report</h3>
          <p>A preview of what the agent returns. Run a query to get all 75 services.</p>

          <div className="glass-card table-card">
            <table className="services-table">
              <thead>
                <tr>
                  {["Service", "Category", "pay.sh Price", "Direct Alternative", "Savings"].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SAMPLE_SERVICES.map((s) => (
                  <tr key={s.name}>
                    <td><strong>{s.name}</strong></td>
                    <td><span className="stat-badge badge-purple">{s.category}</span></td>
                    <td>{s.paysh}</td>
                    <td>{s.direct}</td>
                    <td><span className="stat-badge badge-green">{s.saving}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="table-footer">
              <Link href="/query">Run agent query to see all 75 services</Link>
            </div>
          </div>
        </section>

        <section id="why" className="section-block">
          <h3>Why PayShield?</h3>

          <div className="why-grid">
            {WHY_CARDS.map((c) => (
              <div key={c.title} className="glass-card why-card">
                <h4>{c.title}</h4>
                <p>{c.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-card cta-card">
          <h3>Ready to stop researching?</h3>
          <p>
            Connect Phantom. Pay 0.001 SOL. Get the full pay.sh intelligence report in seconds.
          </p>
          <Link href="/query" className="btn-primary">
            Run Agent Query — 0.001 SOL
          </Link>
        </section>

        <footer className="footer">
          <p>PayShield · Built on Solana · x402 Protocol · pay.sh ecosystem</p>
          <div>
            <a href="https://pay.sh" target="_blank" rel="noopener noreferrer">pay.sh</a>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">github</a>
            <Link href="/query">query console</Link>
          </div>
        </footer>
      </div>
    </main>
  )
}