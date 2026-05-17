'use client'

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-void flex items-center justify-center">
      <div className="text-center">
        <p
          className="text-muted uppercase tracking-widest text-xs mb-4"
          style={{ fontFamily: 'var(--font-dm-mono)' }}
        >
          Phase 4
        </p>
        <h1
          className="text-4xl font-bold text-white mb-2"
          style={{ fontFamily: 'var(--font-syne)' }}
        >
          Dashboard
        </h1>
        <p className="text-secondary text-sm">Coming after Phase 1–3.</p>
      </div>
    </main>
  )
}
