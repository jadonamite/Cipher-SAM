'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import { motion } from 'framer-motion'
import Link from 'next/link'
import ConfidenceScore from '@/components/app/ConfidenceScore'
import TopNav from '@/components/app/TopNav'
import { normalizeSubscription } from '@/lib/normalize'
import { formatMoney } from '@/lib/format'
import type { Subscription } from '@/components/app/SubscriptionRow'

// ... (unchanged types and constants)

const getStatusStyle = (status: string) => STATUS_STYLES[status]
const getConfidence = (subscription: Subscription, recommendation: Recommendation | null) => subscription.confidence ?? recommendation?.confidence
const getAction = (subscription: Subscription, recommendation: Recommendation | null) => subscription.action ?? recommendation?.action

export default function SubscriptionDetail() {
  // ... (unchanged state and effects)

  if (!ready || loading) {
    return (
      <main className="min-h-screen bg-void flex items-center justify-center">
        <div className="w-1 h-1 bg-sam-red rounded-full animate-pulse" />
      </main>
    )
  }

  if (!data) return null

  const { subscription: sub, signals, insight, recommendation } = data
  const statusStyle = getStatusStyle(sub.status)
  const confidence = getConfidence(sub, recommendation)
  const action = getAction(sub, recommendation)
  // ... (unchanged rendering)
}