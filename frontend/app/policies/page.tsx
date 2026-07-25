'use client'

import { useEffect, useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import TopNav from '@/components/app/TopNav'

// ... (unchanged code)

const buildConditions = (draft: DraftPolicy): Record<string, unknown> => {
  switch (draft.trigger) {
    case 'trial_cancel':
      return { trial_days: Number(draft.trial_days) || 7, ...(draft.merchant ? { merchant: draft.merchant } : {}) }
    case 'spend_alert':
      return { spend_threshold: Number(draft.spend_threshold) || 100, currency: 'USD' }
    case 'inactivity_pause':
      return { inactive_days: Number(draft.inactive_days) || 30, ...(draft.merchant ? { merchant: draft.merchant } : {}) }
    default:
      return {}
  }
}

// ... (unchanged code)

function PoliciesPage() {
  // ... (unchanged code)

  async function createPolicy() {
    if (!draft.name || saving) return
    setSaving(true)
    try {
      const res = await fetch('/api/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user!.id },
        body: JSON.stringify({
          name: draft.name,
          trigger: draft.trigger,
          action: draft.action,
          conditions: buildConditions(draft),
        }),
      })
      if (res.ok) {
        const { policy } = await res.json()
        setPolicies((prev) => [policy, ...prev])
        setShowNew(false)
        setDraft(BLANK)
      }
    } catch {} finally {
      setSaving(false)
    }
  }

  // ... (unchanged code)
}
