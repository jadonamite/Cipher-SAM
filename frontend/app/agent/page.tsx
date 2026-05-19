'use client'

import { useEffect, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

type AgentStatus = {
  agent: {
    address: string
    configured: boolean
    policyContract: string | null
  }
  user: {
    self_verified: boolean
    self_verified_at: string | null
    policy_granted: boolean
    policy_granted_at: string | null
  } | null
}

type ActionRecord = {
  id: string
  type: string
  triggered_by: string
  executed_at: string
  reversible: boolean
  signature: string
  agent_address: string
  merchant: string
  amount: number
  currency: string
}

const SCOPE_LABELS: Record<string, string> = {
  cancel: 'Cancel subscriptions',
  pause: 'Pause subscriptions',
  remind: 'Schedule reminders',
  analyze: 'Run analysis',
}

function ShortAddress({ address }: { address: string }) {
  if (!address || address === '0x0000000000000000000000000000000000000000') {
    return <span style={{ color: '#525252' }}>Not configured</span>
  }
  return (
    <span style={{ fontFamily: 'var(--font-dm-mono)' }}>
      {address.slice(0, 6)}…{address.slice(-4)}
    </span>
  )
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className="inline-block w-1.5 h-1.5 rounded-full"
      style={{ background: ok ? '#16A34A' : '#525252', flexShrink: 0 }}
    />
  )
}

export default function AgentPage() {
  const { ready, authenticated, user, login } = usePrivy()
  const router = useRouter()

  const [status, setStatus] = useState<AgentStatus | null>(null)
  const [history, setHistory] = useState<ActionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [granting, setGranting] = useState(false)
  const [verifyResult, setVerifyResult] = useState<string | null>(null)

  useEffect(() => {
    if (!ready) return
    if (!authenticated) { router.replace('/dashboard'); return }
    if (!user?.id) return
    load()
  }, [ready, authenticated, user?.id])

  async function load() {
    setLoading(true)
    try {
      const [statusRes, historyRes] = await Promise.all([
        fetch('/api/agent/status', { headers: { 'x-user-id': user!.id } }),
        fetch('/api/agent/history', { headers: { 'x-user-id': user!.id } }),
      ])
      if (statusRes.ok) setStatus(await statusRes.json())
      if (historyRes.ok) setHistory((await historyRes.json()).actions ?? [])
    } catch {
      // server offline
    } finally {
      setLoading(false)
    }
  }

  async function grantPolicy() {
    if (granting || !user?.id) return
    setGranting(true)
    try {
      const res = await fetch('/api/agent/grant-policy', {
        method: 'POST',
        headers: { 'x-user-id': user.id },
      })
      if (res.ok) {
        setStatus((prev) =>
          prev ? { ...prev, user: { ...prev.user!, policy_granted: true, policy_granted_at: new Date().toISOString() } } : prev
        )
      }
    } catch {} finally {
      setGranting(false)
    }
  }

  async function revokePolicy() {
    if (!user?.id) return
    try {
      await fetch('/api/agent/revoke-policy', { method: 'POST', headers: { 'x-user-id': user.id } })
      setStatus((prev) =>
        prev ? { ...prev, user: { ...prev.user!, policy_granted: false } } : prev
      )
    } catch {}
  }

  // Trigger SELF Protocol verification — opens SELF deep link
  function triggerSelfVerify() {
    const selfAppId = process.env.NEXT_PUBLIC_SELF_APP_ID
    if (!selfAppId || !user?.id) {
      setVerifyResult('SELF_APP_ID not configured. Add NEXT_PUBLIC_SELF_APP_ID to frontend/.env.local')
      return
    }
    const callbackUrl = encodeURIComponent(`${window.location.origin}/api/self/verify`)
    const deepLink = `selfxyz://verify?appId=${selfAppId}&scope=sam-ciphergon&userId=${user.id}&callbackUrl=${callbackUrl}`
    window.location.href = deepLink
  }

  if (!ready || loading) {
    return (
      <main className="min-h-screen bg-void flex items-center justify-center">
        <div className="w-1 h-1 bg-sam-red rounded-full animate-pulse" />
      </main>
    )
  }

  if (!authenticated) return null

  const agent = status?.agent
  const userStatus = status?.user
  const isConfigured = agent?.configured ?? false
  const isVerified = userStatus?.self_verified ?? false
  const isPolicyGranted = userStatus?.policy_granted ?? false

  return (
    <main className="min-h-screen bg-void">
      <header
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-4">
          <Link href="/dashboard" style={{ fontFamily: 'var(--font-dm-mono)', color: '#525252', fontSize: '12px' }}>
            ← Dashboard
          </Link>
          <span style={{ fontFamily: 'var(--font-syne)', color: '#fff', fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em' }}>
            Agent Identity
          </span>
        </div>
        <span
          className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
          style={{
            fontFamily: 'var(--font-geist-sans)',
            color: isConfigured ? '#16A34A' : '#525252',
            border: `1px solid ${isConfigured ? 'rgba(22,163,74,0.3)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: '2px',
          }}
        >
          {isConfigured ? 'Active' : 'Not configured'}
        </span>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-10 flex flex-col gap-6">

        {/* Agent wallet card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 p-5"
          style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '2px' }}
        >
          <span style={{ fontFamily: 'var(--font-geist-sans)', color: '#525252', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            SAM Agent
          </span>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Agent Address', value: <ShortAddress address={agent?.address ?? ''} /> },
              { label: 'Policy Contract', value: agent?.policyContract ? <ShortAddress address={agent.policyContract} /> : <span style={{ color: '#525252' }}>Not deployed</span> },
              { label: 'Signing', value: <span style={{ color: isConfigured ? '#16A34A' : '#525252' }}>{isConfigured ? 'HMAC-SHA256 (upgrade to ETH sign)' : 'No key set'}</span> },
              { label: 'Chain', value: <span style={{ color: '#A3A3A3' }}>Celo Mainnet</span> },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col gap-1">
                <span style={{ fontFamily: 'var(--font-geist-sans)', color: '#525252', fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
                <span style={{ fontFamily: 'var(--font-dm-mono)', color: '#A3A3A3', fontSize: '12px' }}>{value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Trust levels */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="flex flex-col gap-4 p-5"
          style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '2px' }}
        >
          <span style={{ fontFamily: 'var(--font-geist-sans)', color: '#525252', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Trust Level
          </span>
          <div className="flex flex-col gap-3">
            {[
              { label: 'Wallet connected', done: !!user?.wallet?.address },
              { label: 'SELF Protocol verified', done: isVerified },
              { label: 'Policy execution granted', done: isPolicyGranted },
            ].map(({ label, done }) => (
              <div key={label} className="flex items-center gap-3">
                <StatusDot ok={done} />
                <span style={{ fontFamily: 'var(--font-geist-sans)', color: done ? '#A3A3A3' : '#525252', fontSize: '13px' }}>
                  {label}
                </span>
                {done && (
                  <span style={{ fontFamily: 'var(--font-dm-mono)', color: '#3a3a3a', fontSize: '10px' }}>✓</span>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* SELF Protocol verification */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          className="flex flex-col gap-4 p-5"
          style={{
            background: '#141414',
            border: `1px solid ${isVerified ? 'rgba(22,163,74,0.2)' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: '2px',
          }}
        >
          <div className="flex items-center justify-between">
            <span style={{ fontFamily: 'var(--font-geist-sans)', color: '#525252', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              SELF Protocol
            </span>
            {isVerified && (
              <span style={{ fontFamily: 'var(--font-dm-mono)', color: '#16A34A', fontSize: '11px' }}>Verified</span>
            )}
          </div>

          {isVerified ? (
            <p style={{ fontFamily: 'var(--font-geist-sans)', color: '#525252', fontSize: '13px' }}>
              Your identity is verified. SAM can log attributable attestations tied to your ZK proof.
            </p>
          ) : (
            <>
              <p style={{ fontFamily: 'var(--font-geist-sans)', color: '#A3A3A3', fontSize: '13px', lineHeight: 1.6 }}>
                Verify your identity with SELF Protocol to enable attributable on-chain attestations.
                Open the SELF app on your phone and scan to generate a ZK proof.
              </p>
              <motion.button
                onClick={triggerSelfVerify}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="self-start px-5 py-2.5 text-xs font-semibold uppercase tracking-widest cursor-pointer"
                style={{
                  fontFamily: 'var(--font-geist-sans)',
                  background: 'transparent',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '2px',
                }}
              >
                Verify with SELF →
              </motion.button>
              {verifyResult && (
                <p style={{ fontFamily: 'var(--font-dm-mono)', color: '#525252', fontSize: '11px' }}>{verifyResult}</p>
              )}
            </>
          )}
        </motion.div>

        {/* ERC8004 Policy */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="flex flex-col gap-4 p-5"
          style={{
            background: '#141414',
            border: `1px solid ${isPolicyGranted ? 'rgba(229,9,20,0.2)' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: '2px',
          }}
        >
          <div className="flex items-center justify-between">
            <span style={{ fontFamily: 'var(--font-geist-sans)', color: '#525252', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              ERC8004 Policy
            </span>
            <span style={{ fontFamily: 'var(--font-dm-mono)', color: isPolicyGranted ? '#E50914' : '#525252', fontSize: '11px' }}>
              {isPolicyGranted ? 'Active' : 'Not granted'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {Object.entries(SCOPE_LABELS).map(([scope, label]) => (
              <div key={scope} className="flex items-center gap-2">
                <StatusDot ok={isPolicyGranted} />
                <span style={{ fontFamily: 'var(--font-geist-sans)', color: '#525252', fontSize: '12px' }}>{label}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            {!isPolicyGranted ? (
              <motion.button
                onClick={grantPolicy}
                disabled={granting}
                whileHover={{ scale: granting ? 1 : 1.02 }}
                whileTap={{ scale: granting ? 1 : 0.98 }}
                className="px-5 py-2.5 text-xs font-semibold uppercase tracking-widest cursor-pointer"
                style={{
                  fontFamily: 'var(--font-geist-sans)',
                  background: granting ? 'transparent' : '#E50914',
                  color: granting ? '#525252' : '#fff',
                  border: `1px solid ${granting ? 'rgba(255,255,255,0.06)' : '#E50914'}`,
                  borderRadius: '2px',
                }}
              >
                {granting ? 'Granting...' : 'Grant Policy Execution'}
              </motion.button>
            ) : (
              <button
                onClick={revokePolicy}
                className="px-5 py-2.5 text-xs font-semibold uppercase tracking-widest cursor-pointer"
                style={{
                  fontFamily: 'var(--font-geist-sans)',
                  background: 'transparent',
                  color: '#525252',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '2px',
                }}
              >
                Revoke
              </button>
            )}
          </div>
        </motion.div>

        {/* Attestation history */}
        {history.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
            className="flex flex-col gap-3"
          >
            <span style={{ fontFamily: 'var(--font-geist-sans)', color: '#525252', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Attestation Log
            </span>
            <div className="flex flex-col gap-1.5">
              {history.slice(0, 10).map((action) => (
                <div
                  key={action.id}
                  className="flex items-center justify-between px-4 py-3"
                  style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '2px' }}
                >
                  <div className="flex flex-col gap-0.5">
                    <span style={{ fontFamily: 'var(--font-geist-sans)', color: '#A3A3A3', fontSize: '12px' }}>
                      {action.merchant} — {action.type}
                    </span>
                    <span style={{ fontFamily: 'var(--font-dm-mono)', color: '#3a3a3a', fontSize: '10px' }}>
                      {action.signature.slice(0, 24)}…
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span style={{ fontFamily: 'var(--font-dm-mono)', color: '#525252', fontSize: '11px' }}>
                      {new Date(action.executed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <span style={{ fontFamily: 'var(--font-geist-sans)', color: '#3a3a3a', fontSize: '9px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      {action.triggered_by}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </main>
  )
}
