async function getPayments(): Promise<{ signatures: { signature: string; timestamp?: number; type?: string }[]; wallet: string }> {
  try {
    const response = await fetch("http://localhost:3000/api/payments", { cache: "no-store" })
    return (await response.json()) as { signatures: { signature: string; timestamp?: number; type?: string }[]; wallet: string }
  } catch {
    return { signatures: [], wallet: process.env.NEXT_PUBLIC_RECEIVER_WALLET ?? "" }
  }
}

export default async function DashboardPage() {
  const payments = await getPayments()
  const recent = payments.signatures.slice(0, 8)

  return (
    <main className="hero-gradient">
      <div className="page-shell">
        <header className="top-nav">
          <div className="brand">
            <h1>PayShield Monitor</h1>
            <p>Live x402 payment visibility and endpoint health.</p>
          </div>
          <a className="btn-secondary" href="/query">
            Query Console
          </a>
        </header>

        <section className="summary-grid">
          <div className="glass-card stat-card">
            <span>Total intelligence queries served</span>
            <strong>1,284</strong>
          </div>
          <div className="glass-card stat-card">
            <span>Micropayment price</span>
            <strong>0.001 SOL</strong>
          </div>
          <div className="glass-card stat-card">
            <span>Receiver wallet</span>
            <strong>{payments.wallet ? `${payments.wallet.slice(0, 4)}...${payments.wallet.slice(-4)}` : "Not set"}</strong>
          </div>
          <div className="glass-card stat-card">
            <span>Endpoint status</span>
            <strong>
              <span className="pulse-dot" /> Protected
            </strong>
          </div>
        </section>

        <section className="dashboard-grid">
          <div className="glass-card panel">
            <h2>Recent payments</h2>
            {recent.length === 0 ? (
              <p style={{ color: "var(--text-secondary)" }}>No Helius transactions loaded yet.</p>
            ) : (
              <table className="services-table">
                <thead>
                  <tr>
                    <th>Signature</th>
                    <th>Type</th>
                    <th>Explorer</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((payment) => (
                    <tr key={payment.signature}>
                      <td>{payment.signature.slice(0, 10)}...{payment.signature.slice(-10)}</td>
                      <td>{payment.type ?? "TRANSFER"}</td>
                      <td>
                        <a href={`https://explorer.solana.com/tx/${payment.signature}?cluster=devnet`} target="_blank" rel="noreferrer">
                          Verify
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="glass-card panel">
            <h2>Most queried categories</h2>
            <div className="pie" aria-label="Mock pie chart for queried categories" />
            <p><span className="stat-badge badge-purple">Media 38%</span></p>
            <p><span className="stat-badge badge-cyan">AI/ML 20%</span></p>
            <p><span className="stat-badge badge-green">Data 18%</span></p>
            <p><span className="stat-badge badge-yellow">Crypto 12%</span></p>
          </div>
        </section>

        <section className="glass-card panel" style={{ marginTop: 18 }}>
          <h2>Protected endpoint</h2>
          <pre className="code-snippet">{`export function middleware(request: NextRequest) {
  const payment = request.headers.get("x-payment")

  if (!payment) {
    return NextResponse.json({
      payTo,
      amount: "0.001",
      asset: "SOL",
      network: "solana:devnet",
      resource: request.nextUrl.toString(),
      nonce: Date.now()
    }, { status: 402 })
  }

  return NextResponse.next()
}`}</pre>
        </section>
      </div>
    </main>
  )
}
