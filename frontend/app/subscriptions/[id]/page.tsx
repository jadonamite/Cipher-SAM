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

async function changeStatus(status: 'active' | 'paused' | 'cancelled') {
  if (!user?.id || statusChanging || !data) return
  setStatusChanging(true)
  try {
    const res = await fetch(`/api/subscriptions/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      setData((prev) => prev ? { ...prev, subscription: { ...prev.subscription, status } } : prev)
    }
  } catch {
    // offline
  } finally {
    setStatusChanging(false)
  }
}

// Extracted function
const handleStatusChange = async (status: 'active' | 'paused' | 'cancelled') => {
  if (!user?.id || statusChanging || !data) return
  setStatusChanging(true)
  try {
    const res = await fetch(`/api/subscriptions/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      setData((prev) => prev ? { ...prev, subscription: { ...prev.subscription, status } } : prev)
    }
  } catch {
    // offline
  } finally {
    setStatusChanging(false)
  }
}

// Usage
<button onClick={() => handleStatusChange('active')}>Change Status</button>
