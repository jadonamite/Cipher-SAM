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

// ... (unchanged code)

const buildSelfAppConfig = (userId: string) => {
  return new SelfAppBuilder({
    appName: 'SAM — Subscription Agentic Manager',
    scope: 'sam-ciphergon',
    endpoint: `${process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3001'}/self/verify`,
    endpointType: 'staging_https',
    userId,
    sessionId: crypto.randomUUID(),
    devMode: process.env.NODE_ENV !== 'production',
    chainID: 42220, // Celo mainnet
  }).build()
}

export default function AgentPage() {
  // ... (unchanged code)

  const selfApp = useMemo(() => {
    if (!user?.id) return null
    return buildSelfAppConfig(user.id)
  }, [user?.id])

  // ... (unchanged code)
}