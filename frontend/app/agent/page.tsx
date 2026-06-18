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

// ... (rest of the code remains the same)

const fetchAgentData = async (userId: string) => {
  try {
    const [statusRes, historyRes] = await Promise.all([
      fetch('/api/agent/status', { headers: { 'x-user-id': userId } }),
      fetch('/api/agent/history', { headers: { 'x-user-id': userId } }),
    ])
    return {
      status: statusRes.ok ? await statusRes.json() : null,
      history: historyRes.ok ? (await historyRes.json()).actions ?? [] : [],
    }
  } catch {
    return { status: null, history: [] }
  }
}

async function load() {
  setLoading(true)
  try {
    const { status, history } = await fetchAgentData(user!.id)
    setStatus(status)
    setHistory(history)
  } finally {
    setLoading(false)
  }
}
// ... (rest of the code remains the same)
