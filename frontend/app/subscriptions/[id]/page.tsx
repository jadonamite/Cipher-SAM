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

const formatAmount = formatMoney

const formatHelper = (iso: string | null | undefined) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatReminderDate = (daysFromNow: number) => {
  const remindAt = new Date(Date.now() + daysFromNow * 86_400_000).toISOString()
  return formatHelper(remindAt)
}

export default function SubscriptionDetail() {
  // ... (unchanged state and effects)

  async function scheduleReminder(daysFromNow: number) {
    if (!user?.id || reminderSending) return
    setReminderSending(true)
    setReminderError(null)
    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
        body: JSON.stringify({
          subscription_id: id,
          remind_at: formatReminderDate(daysFromNow),
          type: 'review',
          user_email: email,
        }),
      })
      if (res.ok) {
        setReminderSent(true)
        setTimeout(() => setReminderSent(false), 4000)
      } else {
        const body = await res.json()
        setReminderError(body.error ?? 'Failed to set reminder')
      }
    } catch {
      setReminderError('Server offline')
    } finally {
      setReminderSending(false)
    }
  }

  // ... (unchanged JSX)

  return (
    // ... (unchanged JSX)
  )
}
