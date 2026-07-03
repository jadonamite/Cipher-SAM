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

async function fetchStatus() {
  const response = await fetch('/api/agent/status', { headers: { 'x-user-id': user!.id } })
  if (response.ok) return await response.json()
  return null
}

async function fetchHistory() {
  const response = await fetch('/api/agent/history', { headers: { 'x-user-id': user!.id } })
  if (response.ok) return (await response.json()).actions ?? []
  return []
}

async function load() {
  setLoading(true)
  try {
    const [status, history] = await Promise.all([fetchStatus(), fetchHistory()])
    setStatus(status)
    setHistory(history)
  } catch {
    // server offline
  } finally {
    setLoading(false)
  }
}

// ... (unchanged code)
