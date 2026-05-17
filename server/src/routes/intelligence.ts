import { Hono } from 'hono'
import { sql } from '../lib/db.js'
import { getCachedInsight, setCachedInsight } from '../lib/cache.js'
import { generateSubscriptionInsight } from '../lib/ai.js'

const app = new Hono()

type SignalWeight = {
  type: string
  value: number
  label: string
}

// Deterministic confidence scorer — 80% of intelligence lives here
function scoreSubscription(signals: SignalWeight[]): number {
  const total = signals.reduce((sum, s) => sum + s.value, 0)
  const max = signals.length * 10
  return Math.min(Math.round((total / max) * 100), 100)
}

function buildSignals(sub: {
  amount: number
  cadence: string
  last_charged: Date | null
  detected_at: Date
}): SignalWeight[] {
  const now = new Date()
  const daysSinceCharge = sub.last_charged
    ? (now.getTime() - new Date(sub.last_charged).getTime()) / (1000 * 60 * 60 * 24)
    : 999

  const signals: SignalWeight[] = []

  // Inactivity signal
  if (daysSinceCharge > 60) signals.push({ type: 'inactivity', value: 9, label: '60+ days since last charge' })
  else if (daysSinceCharge > 30) signals.push({ type: 'inactivity', value: 6, label: '30+ days since last charge' })
  else signals.push({ type: 'inactivity', value: 2, label: 'Recently active' })

  // Amount signal — higher amounts get more scrutiny
  if (sub.amount > 50) signals.push({ type: 'high_value', value: 7, label: `High value: $${sub.amount}` })
  else if (sub.amount > 20) signals.push({ type: 'moderate_value', value: 4, label: `Moderate value: $${sub.amount}` })
  else signals.push({ type: 'low_value', value: 1, label: `Low cost: $${sub.amount}` })

  // Recency of detection
  const daysSinceDetected = (now.getTime() - new Date(sub.detected_at).getTime()) / (1000 * 60 * 60 * 24)
  if (daysSinceDetected > 180) signals.push({ type: 'long_standing', value: 5, label: 'Active 6+ months' })
  else if (daysSinceDetected > 60) signals.push({ type: 'established', value: 3, label: 'Active 2+ months' })
  else signals.push({ type: 'new', value: 1, label: 'Recently detected' })

  return signals
}

function recommendAction(
  confidence: number,
  signals: SignalWeight[]
): 'cancel' | 'pause' | 'remind' | 'keep' {
  const hasInactivity = signals.some((s) => s.type === 'inactivity' && s.value >= 6)
  if (confidence >= 75 && hasInactivity) return 'cancel'
  if (confidence >= 50 && hasInactivity) return 'pause'
  if (confidence >= 40) return 'remind'
  return 'keep'
}

// POST /intelligence/analyze/:subscriptionId
app.post('/analyze/:id', async (c) => {
  const userId = c.req.header('x-user-id')
  const { id } = c.req.param()
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)

  const rows = await sql`
    SELECT * FROM subscriptions WHERE id = ${id} AND user_id = ${userId}
  `
  const sub = rows[0] as { amount: number; cadence: string; last_charged: Date | null; detected_at: Date; name: string } | undefined
  if (!sub) return c.json({ error: 'Not found' }, 404)

  const signals = buildSignals(sub)
  const confidence = scoreSubscription(signals)
  const action = recommendAction(confidence, signals)

  // Store signals
  for (const sig of signals) {
    await sql`
      INSERT INTO signals (subscription_id, type, value, weight)
      VALUES (${id}, ${sig.type}, ${sig.label}, ${sig.value})
      ON CONFLICT DO NOTHING
    `
  }

  // Upsert recommendation
  const [rec] = await sql`
    INSERT INTO recommendations (subscription_id, action, confidence, evidence)
    VALUES (
      ${id},
      ${action},
      ${confidence},
      ${JSON.stringify(signals.map((s) => s.label))}
    )
    ON CONFLICT (subscription_id) DO UPDATE
      SET action = EXCLUDED.action,
          confidence = EXCLUDED.confidence,
          evidence = EXCLUDED.evidence,
          status = 'pending'
    RETURNING *
  `

  // AI insight — check cache first
  let insight = await getCachedInsight(id)
  if (!insight) {
    insight = await generateSubscriptionInsight({
      name: sub.name,
      amount: sub.amount,
      cadence: sub.cadence,
      signals: signals.map((s) => s.label),
    })
    if (insight) await setCachedInsight(id, insight)
  }

  return c.json({ confidence, action, signals, recommendation: rec, insight })
})

// POST /intelligence/analyze-all — batch analyze for a user
app.post('/analyze-all', async (c) => {
  const userId = c.req.header('x-user-id')
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)

  const subs = await sql`
    SELECT * FROM subscriptions WHERE user_id = ${userId} AND status = 'active'
  ` as Array<{ id: string; name: string; amount: number; cadence: string; last_charged: Date | null; detected_at: Date }>

  const results = []
  for (const sub of subs) {
    const signals = buildSignals(sub)
    const confidence = scoreSubscription(signals)
    const action = recommendAction(confidence, signals)
    results.push({ id: sub.id, name: sub.name, confidence, action })
  }

  return c.json({ analyzed: results.length, results })
})

export default app
