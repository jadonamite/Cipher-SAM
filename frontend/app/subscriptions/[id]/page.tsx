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

// ... (unchanged code)

const fetchSubscriptionData = async (id: string, userId: string) => {
  try {
    const res = await fetch(`/api/subscriptions/${id}`, {
      headers: { 'x-user-id': userId },
    })
    if (!res.ok) {
      throw new Error('Failed to fetch subscription data')
    }
    return await res.json()
  } catch (error) {
    console.error('Error fetching subscription data:', error)
    return null
  }
}

async function load() {
  setLoading(true)
  try {
    const data = await fetchSubscriptionData(id, user!.id)
    if (!data) {
      router.replace('/subscriptions')
      return
    }
    setData({
      subscription: normalizeSubscription(data.subscription),
      signals: data.signals ?? [],
      insight: data.insight ?? null,
      recommendation: data.subscription.recommendations?.[0] ?? null,
    })
  } finally {
    setLoading(false)
  }
}

// ... (unchanged code)