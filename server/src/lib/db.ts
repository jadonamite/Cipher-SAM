import { neon } from '@neondatabase/serverless'

if (!process.env.NEON_DATABASE_URL) {
  throw new Error('NEON_DATABASE_URL is required')
}

export const sql = neon(process.env.NEON_DATABASE_URL)

export type User = {
  id: string
  privy_did: string
  wallet_address: string | null
  created_at: Date
}

export type Subscription = {
  id: string
  user_id: string
  name: string
  merchant: string
  amount: number
  currency: string
  cadence: 'daily' | 'weekly' | 'monthly' | 'yearly'
  source: 'gmail' | 'wallet'
  category: string | null
  detected_at: Date
  last_charged: Date | null
  status: 'active' | 'paused' | 'cancelled'
}

export type Signal = {
  id: string
  subscription_id: string
  type: string
  value: string
  weight: number
  created_at: Date
}

export type Recommendation = {
  id: string
  subscription_id: string
  action: 'cancel' | 'pause' | 'remind' | 'keep'
  confidence: number
  evidence: string[]
  status: 'pending' | 'accepted' | 'dismissed'
  created_at: Date
}

export type Action = {
  id: string
  subscription_id: string
  type: string
  triggered_by: 'user' | 'policy'
  executed_at: Date | null
  reversible: boolean
  reversed_at: Date | null
}
