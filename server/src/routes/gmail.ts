import { Hono } from 'hono'
import { sql } from '../lib/db.js'
import { getScanLock } from '../lib/cache.js'

const app = new Hono()

// Known merchant normalization map (seed — expand over time)
const MERCHANT_MAP: Record<string, string> = {
  'netflix.com': 'Netflix',
  'nflx': 'Netflix',
  'spotify.com': 'Spotify',
  'spotify ab': 'Spotify',
  'figma.com': 'Figma',
  'notion.so': 'Notion AI',
  'notion labs': 'Notion AI',
  'github.com': 'GitHub',
  'github copilot': 'GitHub Copilot',
  'openai.com': 'OpenAI',
  'anthropic.com': 'Anthropic',
  'vercel.com': 'Vercel',
  'planetscale': 'PlanetScale',
  'supabase.io': 'Supabase',
  'aws.amazon.com': 'AWS',
  'google cloud': 'Google Cloud',
  'digitalocean': 'DigitalOcean',
  'loom.com': 'Loom',
  'zapier.com': 'Zapier',
  'adobe.com': 'Adobe',
  'dropbox.com': 'Dropbox',
  'slack.com': 'Slack',
  'zoom.us': 'Zoom',
  'linear.app': 'Linear',
  'airtable.com': 'Airtable',
}

// Subscription detection patterns on email subject lines
const SUB_PATTERNS = [
  /your .+ subscription/i,
  /receipt from .+/i,
  /invoice from .+/i,
  /billing confirmation/i,
  /payment confirmed/i,
  /renewal notice/i,
  /trial ending/i,
  /subscription renewed/i,
  /payment receipt/i,
  /charged .+\$/i,
]

export function normalizeMerchant(raw: string): string {
  const lower = raw.toLowerCase()
  for (const [key, name] of Object.entries(MERCHANT_MAP)) {
    if (lower.includes(key)) return name
  }
  // Title-case the raw string as fallback
  return raw
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

export function isSubscriptionEmail(subject: string, sender: string): boolean {
  return SUB_PATTERNS.some((p) => p.test(subject) || p.test(sender))
}

export function extractAmount(text: string): number | null {
  const match = text.match(/\$\s?(\d+(?:\.\d{2})?)/i)
  return match ? parseFloat(match[1]) : null
}

export function detectCadence(
  subject: string
): 'monthly' | 'yearly' | 'weekly' | 'daily' {
  if (/annual|yearly|year/i.test(subject)) return 'yearly'
  if (/weekly|week/i.test(subject)) return 'weekly'
  if (/daily|day/i.test(subject)) return 'daily'
  return 'monthly'
}

// POST /gmail/scan — trigger a Gmail scan for a user
// In production: exchange OAuth token, call Gmail API, parse results
app.post('/scan', async (c) => {
  const userId = c.req.header('x-user-id')
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)

  const acquired = await getScanLock(userId)
  if (!acquired) {
    return c.json({ error: 'Scan already in progress. Try again in 10 minutes.' }, 429)
  }

  // Placeholder — Phase 1 will plug in real Gmail OAuth + API calls here
  return c.json({
    message: 'Scan queued',
    note: 'Gmail OAuth integration ships in Phase 1.',
  })
})

// POST /gmail/parse — receive parsed email payload and create subscription record
app.post('/parse', async (c) => {
  const userId = c.req.header('x-user-id')
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)

  const body = await c.req.json<{
    subject: string
    sender: string
    body_snippet: string
    received_at: string
  }>()

  if (!isSubscriptionEmail(body.subject, body.sender)) {
    return c.json({ detected: false })
  }

  const merchant = normalizeMerchant(body.sender)
  const amount = extractAmount(body.body_snippet)
  const cadence = detectCadence(body.subject)

  if (!amount) return c.json({ detected: false, reason: 'Could not extract amount' })

  // Check for existing subscription (dedup)
  const [existing] = await sql`
    SELECT id FROM subscriptions
    WHERE user_id = ${userId} AND merchant = ${merchant} AND status = 'active'
    LIMIT 1
  `

  if (existing) {
    await sql`
      UPDATE subscriptions SET last_charged = ${body.received_at}
      WHERE id = ${existing.id}
    `
    return c.json({ detected: true, action: 'updated', subscription_id: existing.id })
  }

  const [created] = await sql`
    INSERT INTO subscriptions (user_id, name, merchant, amount, cadence, source, last_charged)
    VALUES (${userId}, ${merchant}, ${merchant}, ${amount}, ${cadence}, 'gmail', ${body.received_at})
    RETURNING id
  `

  return c.json({ detected: true, action: 'created', subscription_id: created.id })
})

export default app
