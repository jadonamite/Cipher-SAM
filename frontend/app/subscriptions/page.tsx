'use client'

import { useEffect, useState, useMemo } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import SubscriptionRow, { type Subscription } from '@/components/app/SubscriptionRow'
import ConnectGmail from '@/components/app/ConnectGmail'
import { useToast } from '@/components/providers/ToastProvider'
import Link from 'next/link'
import TopNav from '@/components/app/TopNav'
import { normalizeSubscription } from '@/lib/normalize'
import { aggregateByCurrency, formatAggregate } from '@/lib/format'

type Filter = 'all' | 'monthly' | 'yearly' | 'high-risk'
type Sort = 'spend' | 'risk' | 'detected'

const CATEGORY_MAP: Record<string, string[]> = {
  Productivity: ['Notion AI', 'Linear', 'Airtable', 'Zapier', 'Loom', 'Grammarly'],
  Entertainment: ['Netflix', 'Spotify', 'Hulu', 'Disney+', 'YouTube Premium', 'Paramount+', 'Amazon Prime'],
  Developer: ['GitHub', 'GitHub Copilot', 'Vercel', 'Supabase', 'PlanetScale', 'DigitalOcean', 'AWS'],
  Design: ['Figma', 'Adobe', 'Canva', 'Midjourney'],
  AI: ['OpenAI', 'Anthropic', 'ChatGPT Plus', 'Midjourney'],
  Cloud: ['Dropbox', 'iCloud', 'Google Cloud', 'AWS'],
  Communication: ['Slack', 'Zoom'],
}

function getCategory(merchant: string): string {
  for (const [cat, merchants] of Object.entries(CATEGORY_MAP)) {
    if (merchants.includes(merchant)) return cat
  }
  return 'Other'
}

function groupByCategory(subs: Subscription[]): Record<string, Subscription[]> {
  const groups: Record<string, Subscription[]> = {}
  for (const sub of subs) {
    const cat = getCategory(sub.merchant)
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(sub)
  }
  return groups
}

export default function SubscriptionsPage() {
  const { ready, authenticated, user, login } = usePrivy()
  const router = useRouter()
  const { showToast } = useToast()

  const [subs, setSubs] = useState<Subscription[]>([])
  const [gmailConnected, setGmailConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSort] = useState<Sort>('spend')
  const [analyzing, setAnalyzing] = useState(false)

  async function fetchSubs(uid: string) {
    const [statusRes, subsRes] = await Promise.all([
      fetch(`/api/gmail/status?user_id=${uid}`),
      fetch('/api/subscriptions', { headers: { 'x-user-id': uid } }),
    ])
    const statusData = await statusRes.json()
    setGmailConnected(statusData.connected ?? false)
    if (subsRes.ok) setSubs(((await subsRes.json()).subscriptions ?? []).map(normalizeSubscription))
  }

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

  async function handleStatusChange(id: string, status: 'active' | 'paused' | 'cancelled') {
    if (!user?.id) return
    try {
      const res = await fetch(`/api/subscriptions/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        setSubs((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)))
        showToast(`Subscription ${status}`, 'success')
      } else {
        showToast('Failed to update subscription', 'error')
      }
    } catch {
      showToast('Could not reach server', 'error')
    }
  }

  async function runAnalysis() {
    if (!user?.id || analyzing) return
    setAnalyzing(true)
    try {
      const res = await fetch('/api/intelligence/analyze-all', {
        method: 'POST',
        headers: { 'x-user-id': user.id },
      })
      if (res.ok) {
        const { results } = await res.json()
        setSubs((prev) =>
          prev.map((s) => {
            const r = results.find((x: any) => x.id === s.id)
            return r ? { ...s, confidence: r.confidence == null ? undefined : Number(r.confidence), action: r.action } : s
          })
        )
        showToast('Analysis complete', 'success')
      } else {
        showToast('Analysis failed', 'error')
      }
    } catch {
      showToast('Could not reach server', 'error')
    } finally {
      setAnalyzing(false)
    }
  }

  const filtered = useMemo(() => {
    let list = subs.filter((s) => s.status === 'active')
    if (filter === 'monthly') list = list.filter((s) => s.cadence === 'monthly')
    if (filter === 'yearly') list = list.filter((s) => s.cadence === 'yearly')
    if (filter === 'high-risk') list = list.filter((s) => (s.confidence ?? 0) >= 60)
    return [...list].sort((a, b) => {
      if (sort === 'risk') return (b.confidence ?? 0) - (a.confidence ?? 0)
      if (sort === 'detected') return (b.id > a.id ? 1 : -1)
      // spend
      const toMonthly = (s: Subscription) =>
        s.cadence === 'yearly' ? s.amount / 12 : s.cadence === 'weekly' ? s.amount * 4.33 : s.amount
      return toMonthly(b) - toMonthly(a)
    })
  }, [subs, filter, sort])

  const groups = groupByCategory(filtered)
  const activeSubs = subs.filter((s) => s.status === 'active')
  const totalMonthlyStr = formatAggregate(
    aggregateByCurrency(
      activeSubs,
      (s) => {
        if (s.cadence === 'yearly') return s.amount / 12
        if (s.cadence === 'weekly') return s.amount * 4.33
        if (s.cadence === 'daily') return s.amount * 30
        return s.amount
      },
      (s) => s.currency ?? 'USD',
    ),
  )

  if (!ready) return null

  if (!authenticated) {
    return (
      <main className="min-h-screen bg-void flex flex-col items-center justify-center gap-6 px-6">
        <motion.button
          onClick={login}
          whileHover={{ scale: 1.02, filter: 'brightness(1.1)' }}
          whileTap={{ scale: 0.98 }}
          className="px-8 py-3 text-sm font-semibold uppercase tracking-widest cursor-pointer"
          style={{ fontFamily: 'var(--font-geist-sans)', background: '#E50914', color: '#fff', borderRadius: '2px' }}
        >
          Connect Wallet
        </motion.button>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-void">
      <TopNav
        title="Subscriptions"
        actions={
          subs.length > 0 ? (
            <motion.button
              onClick={runAnalysis}
              disabled={analyzing}
              whileHover={{ scale: analyzing ? 1 : 1.02 }}
              whileTap={{ scale: analyzing ? 1 : 0.98 }}
              className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest cursor-pointer"
              style={{
                fontFamily: 'var(--font-geist-sans)',
                background: 'transparent',
                color: analyzing ? '#525252' : '#E50914',
                border: `1px solid ${analyzing ? 'rgba(255,255,255,0.08)' : 'rgba(229,9,20,0.4)'}`,
                borderRadius: '2px',
              }}
            >
              {analyzing ? 'Analyzing...' : 'Run Analysis'}
            </motion.button>
          ) : null
        }
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-8">
        {/* Monthly total */}
        {subs.length > 0 && (
          <div className="flex items-end gap-2">
            <span
              style={{
                fontFamily: 'var(--font-dm-mono)',
                color: '#fff',
                fontSize: '40px',
                letterSpacing: '-0.03em',
                lineHeight: 1,
              }}
            >
              {totalMonthlyStr}
            </span>
            <span
              style={{ fontFamily: 'var(--font-dm-mono)', color: '#525252', fontSize: '14px', marginBottom: '4px' }}
            >
              /month
            </span>
          </div>
        )}

        {/* Filters + sort */}
        {subs.length > 0 && (
          <div className='flex items-center justify-between flex-wrap gap-3'>
            <div className="flex gap-2">
              {(['all', 'monthly', 'yearly', 'high-risk'] as Filter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="px-3 py-1 text-[11px] font-semibold uppercase tracking-widest cursor-pointer"
                  style={{
                    fontFamily: 'var(--font-geist-sans)',
                    background: filter === f ? '#E50914' : 'transparent',
                    color: filter === f ? '#fff' : '#525252',
                    border: `1px solid ${filter === f ? '#E50914' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: '2px',
                    transition: 'all 0.15s',
                  }}
                >
                  {f === 'high-risk' ? 'High Risk' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              style={{
                fontFamily: 'var(--font-dm-mono)',
                background: '#141414',
                color: '#A3A3A3',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '2px',
                fontSize: '11px',
                padding: '4px 8px',
                cursor: 'pointer',
              }}
            >
              <option value="spend">Sort: Spend</option>
              <option value="risk">Sort: Risk</option>
              <option value="detected">Sort: Detected</option>
            </select>
          </div>
        )}

        {/* Content */}
        {!gmailConnected ? (
          <ConnectGmail />
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <span style={{ fontFamily: 'var(--font-dm-mono)', color: '#525252', fontSize: '12px' }}>Loading...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p style={{ fontFamily: 'var(--font-geist-sans)', color: '#525252' }} className="text-sm">
              {filter !== 'all' ? 'No subscriptions match this filter.' : 'No active subscriptions found.'}
            </p>
          </div>
        ) : filter === 'all' ? (
          // Grouped by category when showing all
          <div className="flex flex-col gap-8">
            {Object.entries(groups).map(([category, items]) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col gap-2"
              >
                <span
                  style={{
                    fontFamily: 'var(--font-geist-sans)',
                    color: '#525252',
                    fontSize: '11px',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  {category}
                  <span style={{ color: '#3a3a3a', marginLeft: '8px' }}>
                    {formatAggregate(aggregateByCurrency(items, (i) => i.amount, (i) => i.currency ?? 'USD'))}/mo
                  </span>
                </span>
                <div className="flex flex-col gap-1.5">
                  {items.map((sub, i) => (
                    <motion.div
                      key={sub.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <SubscriptionRow sub={sub} onStatusChange={handleStatusChange} href={`/subscriptions/${sub.id}`} />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          // Flat list for filtered views
          <div className="flex flex-col gap-1.5">
            {filtered.map((sub, i) => (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <SubscriptionRow sub={sub} onStatusChange={handleStatusChange} href={`/subscriptions/${sub.id}`} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
