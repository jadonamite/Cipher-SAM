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

const loadSubscription = async (id: string, userId: string) => {
  try {
    const res = await fetch(`/api/subscriptions/${id}`, {
      headers: { 'x-user-id': userId },
    })
    if (!res.ok) throw new Error('Failed to load subscription')
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
        confidence: json.confidence,
        action: json.action,
      }
    }
  } catch (error) {
    console.error(error)
    return null
  }
}

const scheduleReminder = async (id: string, userId: string, daysFromNow: number) => {
  try {
    const remindAt = new Date(Date.now() + daysFromNow * 86_400_000).toISOString()
    const email = user.email?.address ?? user.google?.email ?? null
    const res = await fetch('/api/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      body: JSON.stringify({
        subscription_id: id,
        remind_at: remindAt,
        type: 'review',
        user_email: email,
      }),
    })
    if (res.ok) return true
    const body = await res.json()
    throw new Error(body.error ?? 'Failed to set reminder')
  } catch (error) {
    console.error(error)
    return false
  }
}

const changeStatus = async (id: string, userId: string, status: 'active' | 'paused' | 'cancelled') => {
  try {
    const res = await fetch(`/api/subscriptions/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      body: JSON.stringify({ status }),
    })
    if (res.ok) return true
    throw new Error('Failed to change status')
  } catch (error) {
    console.error(error)
    return false
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
    if (!authenticated) { router.replace('/dashboard'); return }
    if (!user?.id || !id) return
    loadSubscription(id, user.id).then((data) => {
      if (data) {
        setData(data)
        setLoading(false)
      }
    })
  }, [ready, authenticated, user?.id, id])

  // ... (unchanged JSX and event handlers)
}