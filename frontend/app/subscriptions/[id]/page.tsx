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

type Signal = {
  id: string
  type: string
  value: string
  weight: number
}
type Recommendation = {
  id: string
  action: 'cancel' | 'pause' | 'remind' | 'keep'
  confidence: number
  evidence: string[]
  status: string
}
type DetailData = {
  subscription: Subscription & {
    currency: string
    detected_at: string
  }
  signals: Signal[]
  insight: string | null
  recommendation: Recommendation | null
}

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

const fetchSubscriptionData = async (id: string, userId: string) => {
  try {
    const res = await fetch(`/api/subscriptions/${id}`, {
      headers: { 'x-user-id': userId },
    })
    if (!res.ok) {
      throw new Error('Failed to fetch subscription data')
    }
    const json = await res.json()
    return {
      subscription: normalizeSubscription(json.subscription),
      signals: json.signals ?? [],
      insight: json.insight ?? null,
      recommendation: json.subscription.recommendations?.[0] ?? null,
    }
  } catch (error) {
    console.error(error)
    return null
  }
}

const runAnalysis = async (id: string, userId: string) => {
  try {
    const res = await fetch(`/api/intelligence/analyze/${id}`, {
      method: 'POST',
      headers: { 'x-user-id': userId },
    })
    if (res.ok) {
      const json = await res.json()
      return {
        signals: json.signals?.map((s: { type: string; label: string; value: number }) => ({
          id: s.type,
          type: s.type,
          value: s.label,
          weight: s.value,
        })) ?? [],
        insight: json.insight ?? null,
        recommendation: json.recommendation ?? null,
        subscription: {
          confidence: json.confidence,
          action: json.action,
        },
      }
    }
  } catch (error) {
    console.error(error)
    return null
  }
}

export default function SubscriptionDetail() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { ready, authenticated, user } = usePrivy()
  const [data, setData] = useState<DetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [statusChanging, setStatusChanging] = useState(false)
  const [reminderSent, setReminderSent] = useState(false)
  const [reminderSending, setReminderSending] = useState(false)
  const [reminderError, setReminderError] = useState<string | null>(null)

  useEffect(() => {
    if (!ready) return
    if (!authenticated) {
      router.replace('/dashboard')
      return
    }
    if (!user?.id || !id) return
    load()
  }, [ready, authenticated, user?.id, id])

  const load = async () => {
    setLoading(true)
    const userId = user?.id
    if (!userId) return
    const data = await fetchSubscriptionData(id, userId)
    if (data) {
      setData(data)
    }
    setLoading(false)
  }

  const handleRunAnalysis = async () => {
    if (!user?.id || analyzing) return
    setAnalyzing(true)
    const userId = user?.id
    if (!userId) return
    const analysisData = await runAnalysis(id, userId)
    if (analysisData) {
      setData((prev) => prev ? { ...prev, ...analysisData } : prev)
    }
    setAnalyzing(false)
  }

  // ... rest of the code remains the same
}