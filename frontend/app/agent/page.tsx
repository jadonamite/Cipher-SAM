'use client'

import { useEffect, useState, useMemo } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { createWalletClient, custom } from 'viem'
import { celo } from 'viem/chains'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import TopNav from '@/components/app/TopNav'
import { SelfAppBuilder, type SelfApp } from '@selfxyz/qrcode'

// ... (unchanged imports and types)

const getAgentStatus = (status: AgentStatus | null) => {
  const agent = status?.agent
  const userStatus = status?.user
  const isConfigured = agent?.configured ?? false
  const isVerified = userStatus?.self_verified ?? false
  const isPolicyGranted = userStatus?.policy_granted ?? false
  return { isConfigured, isVerified, isPolicyGranted }
}

export default function AgentPage() {
  // ... (unchanged state and effects)

  if (!ready || loading) {
    return (
      <main className="min-h-screen bg-void flex items-center justify-center">
        <div className="w-1 h-1 bg-sam-red rounded-full animate-pulse" />
      </main>
    )
  }

  if (!authenticated) return null

  const { isConfigured, isVerified, isPolicyGranted } = getAgentStatus(status)

  return (
    <main className="min-h-screen bg-void">
      <TopNav
        title="Agent Identity"
        rightMeta={
          <span
            className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
            style={{
              fontFamily: 'var(--font-geist-sans)',
              color: isConfigured ? '#16A34A' : '#525252',
              border: `1px solid ${isConfigured ? 'rgba(22,163,74,0.3)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: '2px',
            }}
          >
            {isConfigured ? 'Active' : 'Not configured'}
          </span>
        }
      />

      <div className="max-w-2xl mx-auto px-6 py-10 flex flex-col gap-6">
        {/* ... (unchanged JSX) */
      </div>
    </main>
  )
}