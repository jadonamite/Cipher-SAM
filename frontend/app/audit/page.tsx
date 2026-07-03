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

const filterActions = (actions: ActionRecord[], filter: 'all' | 'reversible' | 'reversed') => {
  switch (filter) {
    case 'reversible':
      return actions.filter((a) => a.reversible && !a.reversed_at)
    case 'reversed':
      return actions.filter((a) => !!a.reversed_at)
    default:
      return actions
  }
}

// ... (unchanged code)

const reversibleCount = actions.filter((a) => a.reversible && !a.reversed_at).length

// ... (unchanged code)

return (
  // ... (unchanged code)
  <div className="flex flex-col gap-2">
    <AnimatePresence>
      {filterActions(actions, filter).map((action, i) => {
        // ... (unchanged code)
      })}
    </AnimatePresence>
  </div>
  // ... (unchanged code)
)