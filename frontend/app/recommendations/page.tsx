'use client'

import { useEffect, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import TopNav from '@/components/app/TopNav'
import { normalizeRec } from '@/lib/normalize'
import { aggregateByCurrency, formatAggregate, formatMoney } from '@/lib/format'

type Rec = {
  id: string
  action: 'cancel' | 'pause' | 'remind' | 'keep'
  confidence: number
  evidence: string[]
  status: 'pending' | 'accepted' | 'dismissed'
  subscription_id: string
  merchant: string
  name: string
  amount: number
  currency: string
  cadence: 'daily' | 'weekly' | 'monthly' | 'yearly'
  source: 'gmail' | 'wallet'
  last_charged: string | null
}

// Deep-links to known cancellation pages
const CANCEL_URLS: Record<string, string> = {
  Netflix: 'https://www.netflix.com/cancelplan',
  Spotify: 'https://www.spotify.com/account/subscription/cancel',
  'GitHub Copilot': 'https://github.com/settings/copilot',
  GitHub: 'https://github.com/settings/billing',
  Figma: 'https://www.figma.com/settings/billing',
  'Adobe': 'https://account.adobe.com/plans',
  Dropbox: 'https://www.dropbox.com/account/plan',
  'Notion AI': 'https://www.notion.so/profile/billing',
  Zoom: 'https://zoom.us/billing',
  Slack: 'https://slack.com/account/settings',
  Grammarly: 'https://account.grammarly.com/subscription',
  Canva: 'https://www.canva.com/settings/billing',
  'ChatGPT Plus': 'https://chat.openai.com/settings/subscription',
  Midjourney: 'https://www.midjourney.com/account/',
  'Amazon Prime': 'https://www.amazon.com/mc/pipelines/cancellation',
  'Disney+': 'https://www.disneyplus.com/account/subscription',
  Hulu: 'https://secure.hulu.com/account/cancel_confirm',
  'YouTube Premium': 'https://music.youtube.com/paid_memberships',
  Duolingo: 'https://www.duolingo.com/settings/subscription',
  Linear: 'https://linear.app/settings/billing',
  Vercel: 'https://vercel.com/account/billing',
}

const ACTION_COLORS = {
  cancel: '#E50914',
  pause: '#D97706',
  remind: '#3B82F6',
  keep: '#16A34A',
}

const ACTION_LABELS = {
  cancel: 'Cancel',
  pause: 'Pause',
  remind: 'Set Reminder',
  keep: 'Keep',
}

const ACTION_DESC = {
  cancel: 'SAM recommends cancelling — low usage detected',
  pause: 'SAM recommends pausing — you may not need this right now',
  remind: 'SAM recommends reviewing this subscription soon',
  keep: 'SAM thinks this subscription is worth keeping',
}

const CADENCE_LABELS: Record<string, string> = {
  daily: '/day',
  weekly: '/wk',
  monthly: '/mo',
  yearly: '/yr',
}

function monthlyEquiv(amount: number, cadence: string) {
  if (cadence === 'yearly') return amount / 12
  if (cadence === 'weekly') return amount * 4.33
  if (cadence === 'daily') return amount * 30
  return amount
}

const formatAmount = formatMoney

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function RecommendationsPage() {
  const { ready, authenticated, user, login } = usePrivy()
  const router = useRouter()

  const [recs, setRecs] = useState<Rec[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<Record<string, boolean>>({})
  const [done, setDone] = useState<Record<string, { action: string; cancelUrl?: string }>>({})

  useEffect(() => {
    if (!ready || !authenticated || !user?.id) return
    load()
  }, [ready, authenticated, user?.id])

  async function load() {
    setLoading(true)
    try {
      const response = await fetch('/api/recommendations', { headers: { 'x-user-id': user!.id } })
      if (response.ok) setRecs(((await response.json()).recommendations ?? []).map(normalizeRec))
    } catch {
      // server offline
    } finally {
      setLoading(false)
    }
  }

  async function act(rec: Rec, decision: 'accepted' | 'dismissed') {
    if (acting[rec.id]) return
    setActing((prev) => ({ ...prev, [rec.id]: true }))
    try {
      const response = await fetch(`/api/recommendations/${rec.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user!.id },
        body: JSON.stringify({ status: decision }),
      })
      if (response.ok) {
        const cancelUrl = decision === 'accepted' && rec.action === 'cancel'
          ? CANCEL_URLS[rec.merchant]
          : undefined
        setDone((prev) => ({ ...prev, [rec.id]: { action: rec.action, cancelUrl } }))
        setRecs((prev) => prev.filter((r) => r.id !== rec.id))
      }
    } catch {
      // offline
    } finally {
      setActing((prev) => ({ ...prev, [rec.id]: false }))
    }
  }

  const savingsCandidates = recs.filter((r) => r.action === 'cancel' || r.action === 'pause')
  const savingsByCurrency = aggregateByCurrency(
    savingsCandidates,
    (r) => monthlyEquiv(r.amount, r.cadence),
    (r) => r.currency ?? 'USD',
  )
  const totalSavings = Object.values(savingsByCurrency).reduce((s, v) => s + v, 0)
  const totalSavingsStr = formatAggregate(savingsByCurrency)

  if (!ready) return null

  if (!authenticated) {
    return (
      <main className="min-h-screen bg-void flex items-center justify-center">
        <motion.button
          onClick={login}
          whileHover={{ scale: 1.02 }}
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
        title="Recommendations"
        rightMeta={
          recs.length > 0 ? (
            <span style={{ fontFamily: 'var(--font-dm-mono)', color: '#525252', fontSize: '11px' }}>
              {recs.length} pending
            </span>
          ) : null
        }
      />

      <div className="max-w-2xl mx-auto px-6 py-10 flex flex-col gap-8">

        {/* Potential savings banner */}
        {totalSavings > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between px-5 py-4"
            style={{
              background: 'rgba(229,9,20,0.06)',
              border: '1px solid rgba(229,9,20,0.2)',
              borderRadius: '2px',
            }}
          >
            <span style={{ fontFamily: 'var(--font-geist-sans)', color: '#A3A3A3', fontSize: '13px' }}>
              Potential monthly savings
            </span>
            <span style={{ fontFamily: 'var(--font-dm-mono)', color: '#E50914', fontSize: '20px', letterSpacing: '-0.02em' }}>
              {totalSavingsStr}
            </span>
          </motion.div>
        )}

        {/* Completed actions (toast-style, auto-dismissed) */}
        <AnimatePresence>
          {Object.entries(done).map(([id, info]) => (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-between px-4 py-3"
              style={{
                background: 'rgba(22,163,74,0.06)',
                border: '1px solid rgba(22,163,74,0.2)',
                borderRadius: '2px',
                overflow: 'hidden',
              }}
            >
              <span style={{ fontFamily: 'var(--font-geist-sans)', color: '#16A34A', fontSize: '13px' }}>
                {info.action === 'cancel' ? 'Subscription cancelled' : info.action === 'pause' ? 'Subscription paused' : info.action === 'remind' ? 'Reminder set' : 'Marked as keep'}
              </span>
              {info.cancelUrl && (
                <a
                  href={info.cancelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-semibold uppercase tracking-widest"
                  style={{
                    fontFamily: 'var(--font-geist-sans)',
                    color: '#E50914',
                    textDecoration: 'none',
                  }}
                >
                  Open Cancellation Page →
                </a>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span style={{ fontFamily: 'var(--font-dm-mono)', color: '#525252', fontSize: '12px' }}>Loading...</span>
          </div>
        ) : recs.length === 0 && Object.keys(done).length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <span style={{ fontFamily: 'var(--font-dm-mono)', color: '#525252', fontSize: '12px' }}>
              No pending recommendations.
            </span>
            <p style={{ fontFamily: 'var(--font-geist-sans)', color: '#3a3a3a', fontSize: '12px' }}>
              Run analysis on your subscriptions to generate recommendations.
            </p>
            <Link
              href="/subscriptions"
              style={{
                fontFamily: 'var(--font-geist-sans)',
                color: '#E50914',
                fontSize: '11px',
                textDecoration: 'none',
              }}
            >
              Go to Subscriptions →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <AnimatePresence>
              {recs.map((rec, i) => {
                const color = ACTION_COLORS[rec.action]
                const isActing = acting[rec.id]
                const cancelUrl = CANCEL_URLS[rec.merchant]

                return (
                  <motion.div
                    key={rec.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="flex flex-col gap-4 p-5"
                    style={{
                      background: '#141414',
                      border: `1px solid ${color}20`,
                      borderRadius: '2px',
                    }}
                  >
                    {/* Top row: merchant + action badge */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 flex items-center justify-center flex-shrink-0"
                          style={{ background: `${color}15`, border: `1px solid ${color}30`, borderRadius: '2px' }}
                        >
                          <span style={{ fontFamily: 'var(--font-syne)', color, fontSize: '14px', fontWeight: 700 }}>
                            {rec.merchant.charAt(0)}
                          </span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <Link
                            href={`/subscriptions/${rec.subscription_id}`}
                            style={{ fontFamily: 'var(--font-geist-sans)', color: '#fff', fontSize: '14px', fontWeight: 500, textDecoration: 'none' }}
                          >
                            {rec.merchant}
                          </Link>
                          <div className="flex items-center gap-2">
                            <span style={{ fontFamily: 'var(--font-dm-mono)', color: '#A3A3A3', fontSize: '13px' }}>
                              {formatAmount(rec.amount, rec.currency)}{CADENCE_LABELS[rec.cadence]}
                            </span>
                            {rec.last_charged && (
                              <>
                                <span style={{ color: '#525252', fontSize: '10px' }}>·</span>
                                <span style={{ fontFamily: 'var(--font-dm-mono)', color: '#525252', fontSize: '11px' }}>
                                  last {formatDate(rec.last_charged)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Confidence + action */}
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span
                          className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                          style={{ fontFamily: 'var(--font-geist-sans)', color, border: `1px solid ${color}50`, borderRadius: '2px' }}
                        >
                          {rec.action}
                        </span>
                        <span style={{ fontFamily: 'var(--font-dm-mono)', color: '#525252', fontSize: '11px' }}>
                          {rec.confidence}% risk
                        </span>
                      </div>
                    </div>

                    {/* Reason */}
                    <p style={{ fontFamily: 'var(--font-geist-sans)', color: '#525252', fontSize: '12px' }}>
                      {ACTION_DESC[rec.action]}
                    </p>

                    {/* Evidence bullets */}
                    {rec.evidence?.length > 0 && (
                      <ul className="flex flex-col gap-1">
                        {rec.evidence.map((e, j) => (
                          <li key={j} className="flex items-center gap-2" style={{ fontFamily: 'var(--font-geist-sans)', color: '#A3A3A3', fontSize: '12px' }}>
                            <span style={{ color, fontSize: '5px' }}>●</span>
                            {e}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Confidence bar */}
                    <div className="h-px w-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${rec.confidence}%` }}
                        transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
                        className="h-full"
                        style={{ background: color }}
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <motion.button
                        onClick={() => act(rec, 'accepted')}
                        disabled={isActing}
                        whileHover={{ scale: isActing ? 1 : 1.02 }}
                        whileTap={{ scale: isActing ? 1 : 0.98 }}
                        className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest cursor-pointer"
                        style={{
                          fontFamily: 'var(--font-geist-sans)',
                          background: isActing ? 'transparent' : color,
                          color: isActing ? '#525252' : '#fff',
                          border: `1px solid ${isActing ? 'rgba(255,255,255,0.06)' : color}`,
                          borderRadius: '2px',
                        }}
                      >
                        {isActing ? '...' : ACTION_LABELS[rec.action]}
                      </motion.button>

                      {/* Deep-link for cancel actions */}
                      {rec.action === 'cancel' && cancelUrl && (
                        <a
                          href={cancelUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest"
                          style={{
                            fontFamily: 'var(--font-geist-sans)',
                            background: 'transparent',
                            color: '#A3A3A3',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '2px',
                            textDecoration: 'none',
                            display: 'inline-block',
                          }}
                        >
                          Cancel Page →
                        </a>
                      )}

                      <button
                        onClick={() => act(rec, 'dismissed')}
                        disabled={isActing}
                        className="px-4 py-2 text-[11px] font-semibold uppercase tracking-widest cursor-pointer"
                        style={{
                          fontFamily: 'var(--font-geist-sans)',
                          background: 'transparent',
                          color: '#525252',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: '2px',
                        }}
                      >
                        Dismiss
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </main>
  )
}
