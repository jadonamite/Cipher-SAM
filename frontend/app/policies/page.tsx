'use client'

import { useEffect, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import TopNav from '@/components/app/TopNav'

// ... (unchanged imports and types)

const buildTrialConditions = (draft: DraftPolicy) => ({
  trial_days: Number(draft.trial_days) || 7,
  ...(draft.merchant ? { merchant: draft.merchant } : {}),
})

const buildSpendConditions = (draft: DraftPolicy) => ({
  spend_threshold: Number(draft.spend_threshold) || 100,
  currency: 'USD',
})

const buildInactivityConditions = (draft: DraftPolicy) => ({
  inactive_days: Number(draft.inactive_days) || 30,
  ...(draft.merchant ? { merchant: draft.merchant } : {}),
})

function buildConditions(draft: DraftPolicy) {
  switch (draft.trigger) {
    case 'trial_cancel':
      return buildTrialConditions(draft)
    case 'spend_alert':
      return buildSpendConditions(draft)
    case 'inactivity_pause':
      return buildInactivityConditions(draft)
    default:
      return {}
  }
}

// ... (unchanged code)
