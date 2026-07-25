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

// ... (unchanged imports and types)

const filterSubscriptions = (subs: Subscription[], filter: Filter) => {
  switch (filter) {
    case 'monthly':
      return subs.filter((s) => s.status === 'active' && s.cadence === 'monthly')
    case 'yearly':
      return subs.filter((s) => s.status === 'active' && s.cadence === 'yearly')
    case 'high-risk':
      return subs.filter((s) => s.status === 'active' && (s.confidence ?? 0) >= 60)
    default:
      return subs.filter((s) => s.status === 'active')
  }
}

const toMonthly = (s: Subscription) =>
  s.cadence === 'yearly' ? s.amount / 12 :
  s.cadence === 'weekly' ? s.amount * 4.33 :
  s.cadence === 'daily' ? s.amount * 30 :
  s.amount

const sortSubscriptions = (subs: Subscription[], sort: Sort) => {
  switch (sort) {
    case 'risk':
      return subs.sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))
    case 'detected':
      return subs.sort((a, b) => (b.id > a.id ? 1 : -1))
    default:
      return subs.sort((a, b) => toMonthly(b) - toMonthly(a))
  }
}

const filterAndSortSubscriptions = (subs: Subscription[], filter: Filter, sort: Sort) =>
  sortSubscriptions(filterSubscriptions(subs, filter), sort)

export default function SubscriptionsPage() {
  // ... (unchanged state and effects)

  const filtered = useMemo(() => filterAndSortSubscriptions(subs, filter, sort), [subs, filter, sort])
  const groups = groupByCategory(filtered)
  const activeSubs = subs.filter((s) => s.status === 'active')
  const totalMonthlyStr = formatAggregate(
    aggregateByCurrency(
      activeSubs,
      (s) => toMonthly(s),
      (s) => s.currency ?? 'USD',
    ),
  )

  // ... (unchanged rendering)
}