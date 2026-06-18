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

const fetchStatus = async (userId: string) => {
  try {
    const response = await fetch('/api/agent/status', {
      headers: {
        'x-user-id': userId,
      },
    })
    if (response.ok) {
      return await response.json()
    } else {
      throw new Error(`Failed to fetch status: ${response.status}`)
    }
  } catch (error) {
    console.error('Error fetching status:', error)
    return null
  }
}

const fetchHistory = async (userId: string) => {
  try {
    const response = await fetch('/api/agent/history', {
      headers: {
        'x-user-id': userId,
      },
    })
    if (response.ok) {
      return (await response.json()).actions ?? []
    } else {
      throw new Error(`Failed to fetch history: ${response.status}`)
    }
  } catch (error) {
    console.error('Error fetching history:', error)
    return []
  }
}

async function load() {
  setLoading(true)
  try {
    const [status, history] = await Promise.all([
      fetchStatus(user!.id),
      fetchHistory(user!.id),
    ])
    setStatus(status)
    setHistory(history)
  } catch (error) {
    console.error('Error loading data:', error)
  } finally {
    setLoading(false)
  }
}
// ... (rest of the code remains the same)