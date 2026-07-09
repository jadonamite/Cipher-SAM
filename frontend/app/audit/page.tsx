'use client'

import { useEffect, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import TopNav from '@/components/app/TopNav'
import { normalizeAction } from '@/lib/normalize'
import { formatMoney } from '@/lib/format'

// ... (unchanged code)

const getFilteredActions = (actions: ActionRecord[], filter: 'all' | 'reversible' | 'reversed') => {
  switch (filter) {
    case 'reversible':
      return actions.filter((a) => a.reversible && !a.reversed_at)
    case 'reversed':
      return actions.filter((a) => !!a.reversed_at)
    default:
      return actions
  }
}

const getReversibleCount = (actions: ActionRecord[]) => {
  return actions.filter((a) => a.reversible && !a.reversed_at).length
}

export default function AuditPage() {
  // ... (unchanged code)

  const [filter, setFilter] = useState<'all' | 'reversible' | 'reversed'>('all')

  const filtered = getFilteredActions(actions, filter)
  const reversibleCount = getReversibleCount(actions)

  // ... (unchanged code)
}
