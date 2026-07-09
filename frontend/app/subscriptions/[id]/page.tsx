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

// ... (unchanged imports and types)

const ACTION_COLORS = {
  cancel: '#E50914',
  pause: '#D97706',
  remind: '#3B82F6',
  keep: '#16A34A',
}

const CADENCE_LABELS: Record<string, string> = {
  daily: '/day',
  weekly: '/wk',
  monthly: '/mo',
  yearly: '/yr',
}

const STATUS_STYLES: Record<string, { color: string; border: string }> = {
  active: { color: '#16A34A', border: 'rgba(22,163,74,0.3)' },
  paused: { color: '#D97706', border: 'rgba(217,119,6,0.3)' },
  cancelled: { color: '#525252', border: 'rgba(255,255,255,0.1)' },
}

const formatAmount = formatMoney

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const updateSubscriptionStatus = async (
  user: any,
  id: string,
  status: 'active' | 'paused' | 'cancelled',
  setData: (data: any) => void,
  setStatusChanging: (statusChanging: boolean) => void
) => {
  setStatusChanging(true)
  try {
    const res = await fetch(`/api/subscriptions/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      setData((prev: any) => prev ? { ...prev, subscription: { ...prev.subscription, status } } : prev)
    }
  } catch {
    // offline
  } finally {
    setStatusChanging(false)
  }
}

export default function SubscriptionDetail() {
  // ... (unchanged state and effects)

  async function changeStatus(status: 'active' | 'paused' | 'cancelled') {
    if (!user?.id || statusChanging || !data) return
    updateSubscriptionStatus(user, id, status, setData, setStatusChanging)
  }

  // ... (unchanged JSX)
}