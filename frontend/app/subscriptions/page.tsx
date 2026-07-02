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

// ... (unchanged code)

const calculateTotalMonthlySpend = (subs: Subscription[]) => {
  const activeSubs = subs.filter((s) => s.status === 'active')
  return formatAggregate(
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
}

// ... (unchanged code)

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
            {calculateTotalMonthlySpend(subs)}
          </span>
          <span
            style={{ fontFamily: 'var(--font-dm-mono)', color: '#5
…(truncated)…