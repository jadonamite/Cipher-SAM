'use client'

import { useEffect, useState, Suspense } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import ConnectGmail from '@/components/app/ConnectGmail'
import SubscriptionRow, { type Subscription } from '@/components/app/SubscriptionRow'
import Link from 'next/link'

export default function Dashboard() {
  return (
    <Suspense>
      <DashboardInner />
    </Suspense>
  )
}

type SummaryStats = {
  totalMonthly: number
  count: number
  highRisk: number
}

function calcStats(subs: Subscription[]): SummaryStats {
  const active = subs.filter((s) => s.status === 'active')
  const totalMonthly = active.reduce((sum, s) => {
    if (s.cadence === 'yearly') return sum + s.amount / 12
    if (s.cadence === 'weekly') return sum + s.amount * 4.33
    if (s.cadence === 'daily') return sum + s.amount * 30
    return sum + s.amount
  }, 0)
  const highRisk = active.filter((s) => (s.confidence ?? 0) >= 60).length
  return { totalMonthly, count: active.length, highRisk }
}

function DashboardInner() {
  const { ready, authenticated, user, login } = usePrivy()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [gmailConnected, setGmailConnected] = useState(false)
  const [subs, setSubs] = useState<Subscription[]>([])
  const [scanning, setScanning] = useState(false)
  const [walletScanning, setWalletScanning] = useState(false)
  const [scanResult, setScanResult] = useState<{ created: number; updated: number; source: string } | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchSubs(uid: string) {
    const [statusRes, subsRes] = await Promise.all([
      fetch(`/api/gmail/status?user_id=${uid}`),
      fetch('/api/subscriptions', { headers: { 'x-user-id': uid } }),
    ])
    const statusData = await statusRes.json()
    setGmailConnected(statusData.connected ?? false)
    if (subsRes.ok) setSubs((await subsRes.json()).subscriptions ?? [])
  }

  // Initial load
  useEffect(() => {
    if (!ready || !authenticated || !user?.id) return
    setLoading(true)
    fetchSubs(user.id).catch(() => {}).finally(() => setLoading(false))
  }, [ready, authenticated, user?.id])

  // Poll every 30s while tab is visible
  useEffect(() => {
    if (!authenticated || !user?.id) return
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') fetchSubs(user!.id).catch(() => {})
    }, 30_000)
    return () => clearInterval(id)
  }, [authenticated, user?.id])

  // Handle OAuth redirect params
  useEffect(() => {
    if (searchParams.get('connected') === 'gmail') {
      setGmailConnected(true)
      router.replace('/dashboard')
      triggerScan()
    }
  }, [searchParams])

  async function triggerScan() {
    if (!user?.id || scanning) return
    setScanning(true)
    setScanResult(null)
    try {
      const res = await fetch('/api/gmail/scan', {
        method: 'POST',
        headers: { 'x-user-id': user.id },
      })
      const data = await res.json()
      if (res.ok) {
        setScanResult({ created: data.created, updated: data.updated, source: 'Gmail' })
        const subsRes = await fetch('/api/subscriptions', { headers: { 'x-user-id': user.id } })
        if (subsRes.ok) setSubs((await subsRes.json()).subscriptions ?? [])
      }
    } catch {
      // server offline
    } finally {
      setScanning(false)
    }
  }

  async function triggerWalletScan() {
    const address = user?.wallet?.address
    if (!address || walletScanning) return
    setWalletScanning(true)
    setScanResult(null)
    try {
      const res = await fetch('/api/wallet/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user!.id },
        body: JSON.stringify({ address }),
      })
      const data = await res.json()
      if (res.ok) {
        setScanResult({ created: data.created, updated: data.updated, source: 'Wallet' })
        const subsRes = await fetch('/api/subscriptions', { headers: { 'x-user-id': user!.id } })
        if (subsRes.ok) setSubs((await subsRes.json()).subscriptions ?? [])
      }
    } catch {
      // server offline
    } finally {
      setWalletScanning(false)
    }
  }

  async function handleStatusChange(id: string, status: 'active' | 'paused' | 'cancelled') {
    if (!user?.id) return
    try {
      await fetch(`/api/subscriptions/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
        body: JSON.stringify({ status }),
      })
      setSubs((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)))
    } catch {
      // offline
    }
  }

  if (!ready) {
    return (
      <main className="min-h-screen bg-void flex items-center justify-center">
        <div className="w-1 h-1 bg-sam-red rounded-full animate-pulse" />
      </main>
    )
  }

  if (!authenticated) {
    return (
      <main className="min-h-screen bg-void flex flex-col items-center justify-center gap-6 px-6">
        <h1
          className="text-3xl font-bold text-white text-center"
          style={{ fontFamily: 'var(--font-syne)', letterSpacing: '-0.03em' }}
        >
          SAM
        </h1>
        <p style={{ fontFamily: 'var(--font-geist-sans)', color: '#A3A3A3' }} className="text-sm text-center">
          Connect your wallet to get started
        </p>
        <motion.button
          onClick={login}
          whileHover={{ scale: 1.02, filter: 'brightness(1.1)' }}
          whileTap={{ scale: 0.98 }}
          className="px-8 py-3 text-sm font-semibold uppercase tracking-widest cursor-pointer"
          style={{
            fontFamily: 'var(--font-geist-sans)',
            background: '#E50914',
            color: '#fff',
            borderRadius: '2px',
            letterSpacing: '0.08em',
          }}
        >
          Connect Wallet
        </motion.button>
      </main>
    )
  }

  const stats = calcStats(subs)
  const activeSubs = subs.filter((s) => s.status === 'active').slice(0, 5)

  return (
    <main className="min-h-screen bg-void">
      {/* Top bar */}
      <header
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <span
          className="text-white font-bold tracking-tight"
          style={{ fontFamily: 'var(--font-syne)', fontSize: '18px', letterSpacing: '-0.02em' }}
        >
          SAM
        </span>
        <div className="flex items-center gap-3">
          <Link
            href="/recommendations"
            style={{ fontFamily: 'var(--font-dm-mono)', color: '#525252', fontSize: '11px' }}
          >
            Recommendations
          </Link>
          <Link
            href="/agent"
            style={{ fontFamily: 'var(--font-dm-mono)', color: '#525252', fontSize: '11px' }}
          >
            Agent
          </Link>
          <Link
            href="/audit"
            style={{ fontFamily: 'var(--font-dm-mono)', color: '#525252', fontSize: '11px' }}
          >
            Audit
          </Link>
          {user?.wallet?.address && (
            <motion.button
              onClick={triggerWalletScan}
              disabled={walletScanning}
              whileHover={{ scale: walletScanning ? 1 : 1.02 }}
              whileTap={{ scale: walletScanning ? 1 : 0.98 }}
              className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest cursor-pointer"
              style={{
                fontFamily: 'var(--font-geist-sans)',
                background: 'transparent',
                color: walletScanning ? '#525252' : '#A3A3A3',
                border: `1px solid ${walletScanning ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.12)'}`,
                borderRadius: '2px',
                letterSpacing: '0.08em',
              }}
            >
              {walletScanning ? 'Scanning...' : 'Scan Wallet'}
            </motion.button>
          )}
          {gmailConnected && (
            <motion.button
              onClick={triggerScan}
              disabled={scanning}
              whileHover={{ scale: scanning ? 1 : 1.02 }}
              whileTap={{ scale: scanning ? 1 : 0.98 }}
              className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest cursor-pointer"
              style={{
                fontFamily: 'var(--font-geist-sans)',
                background: 'transparent',
                color: scanning ? '#525252' : '#E50914',
                border: `1px solid ${scanning ? 'rgba(255,255,255,0.08)' : 'rgba(229,9,20,0.4)'}`,
                borderRadius: '2px',
                letterSpacing: '0.08em',
              }}
            >
              {scanning ? 'Scanning...' : 'Scan Gmail'}
            </motion.button>
          )}
          <span
            style={{ fontFamily: 'var(--font-dm-mono)', color: '#525252', fontSize: '11px' }}
          >
            {user?.email?.address ?? (user?.wallet?.address?.slice(0, 8) + '...')}
          </span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10 flex flex-col gap-10">
        {/* Scan result toast */}
        {scanResult && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 py-3 text-sm"
            style={{
              background: 'rgba(22,163,74,0.08)',
              border: '1px solid rgba(22,163,74,0.2)',
              borderRadius: '2px',
              fontFamily: 'var(--font-geist-sans)',
              color: '#16A34A',
            }}
          >
            {scanResult.source} scan complete — {scanResult.created} new subscription{scanResult.created !== 1 ? 's' : ''} detected
            {scanResult.updated > 0 && `, ${scanResult.updated} updated`}
          </motion.div>
        )}

        {/* Stats row */}
        {subs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-3 gap-4"
          >
            {[
              {
                label: 'Monthly Spend',
                value: `$${stats.totalMonthly.toFixed(2)}`,
                mono: true,
              },
              {
                label: 'Active Subscriptions',
                value: String(stats.count),
                mono: true,
              },
              {
                label: 'High Risk',
                value: String(stats.highRisk),
                mono: true,
                alert: stats.highRisk > 0,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col gap-1 p-4"
                style={{
                  background: '#141414',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '2px',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-dm-mono)',
                    color: stat.alert ? '#E50914' : '#fff',
                    fontSize: '24px',
                    letterSpacing: '-0.02em',
                    lineHeight: 1,
                  }}
                >
                  {stat.value}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-geist-sans)',
                    color: '#525252',
                    fontSize: '11px',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  {stat.label}
                </span>
              </div>
            ))}
          </motion.div>
        )}

        {/* Gmail connect or subscription list */}
        {!gmailConnected ? (
          <ConnectGmail />
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <span style={{ fontFamily: 'var(--font-dm-mono)', color: '#525252', fontSize: '12px' }}>
              Loading...
            </span>
          </div>
        ) : subs.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <p style={{ fontFamily: 'var(--font-geist-sans)', color: '#A3A3A3' }} className="text-sm">
              No subscriptions detected yet.
            </p>
            <motion.button
              onClick={triggerScan}
              disabled={scanning}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-2.5 text-xs font-semibold uppercase tracking-widest cursor-pointer"
              style={{
                fontFamily: 'var(--font-geist-sans)',
                background: '#E50914',
                color: '#fff',
                borderRadius: '2px',
              }}
            >
              {scanning ? 'Scanning...' : 'Scan Now'}
            </motion.button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col gap-2"
          >
            <div className="flex items-center justify-between mb-2">
              <span
                style={{
                  fontFamily: 'var(--font-geist-sans)',
                  color: '#525252',
                  fontSize: '11px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                Recent Subscriptions
              </span>
              <Link
                href="/subscriptions"
                style={{ fontFamily: 'var(--font-geist-sans)', color: '#E50914', fontSize: '11px' }}
              >
                View all →
              </Link>
            </div>
            <div className="flex flex-col gap-1.5">
              {activeSubs.map((sub, i) => (
                <motion.div
                  key={sub.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <SubscriptionRow sub={sub} onStatusChange={handleStatusChange} href={`/subscriptions/${sub.id}`} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </main>
  )
}
