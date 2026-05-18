import { Hono } from 'hono'
import { google } from 'googleapis'
import { sql, getOrCreateUser } from '../lib/db.js'
import { getScanLock, storeGmailTokens, getGmailTokens, hasGmailConnected } from '../lib/cache.js'

const app = new Hono()

// ---------------------------------------------------------------------------
// Merchant normalization
// ---------------------------------------------------------------------------

const MERCHANT_MAP: Record<string, string> = {
  'netflix.com': 'Netflix',
  'nflx': 'Netflix',
  'spotify.com': 'Spotify',
  'spotify ab': 'Spotify',
  'figma.com': 'Figma',
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
  'canva.com': 'Canva',
  'notion.so': 'Notion AI',
  'grammarly.com': 'Grammarly',
  'duolingo.com': 'Duolingo',
  'apple.com': 'Apple',
  'icloud.com': 'iCloud',
  'microsoft.com': 'Microsoft',
  'office365': 'Microsoft 365',
  'youtube premium': 'YouTube Premium',
  'amazon.com': 'Amazon',
  'prime video': 'Amazon Prime',
  'hulu': 'Hulu',
  'disney': 'Disney+',
  'paramount': 'Paramount+',
  'chatgpt': 'ChatGPT Plus',
  'midjourney': 'Midjourney',
}

export function normalizeMerchant(raw: string): string {
  const lower = raw.toLowerCase()
  for (const [key, name] of Object.entries(MERCHANT_MAP)) {
    if (lower.includes(key)) return name
  }
  return raw
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

// ---------------------------------------------------------------------------
// Email detection helpers
// ---------------------------------------------------------------------------

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
  /your .+ plan/i,
  /thanks for your payment/i,
  /order confirmation/i,
  /auto.?renew/i,
]

export function isSubscriptionEmail(subject: string, sender: string): boolean {
  return SUB_PATTERNS.some((p) => p.test(subject) || p.test(sender))
}

export function extractAmount(text: string): number | null {
  const match = text.match(/\$\s?(\d+(?:\.\d{2})?)/i)
  return match ? parseFloat(match[1]) : null
}

export function detectCadence(subject: string): 'monthly' | 'yearly' | 'weekly' | 'daily' {
  if (/annual|yearly|year/i.test(subject)) return 'yearly'
  if (/weekly|week/i.test(subject)) return 'weekly'
  if (/daily|day/i.test(subject)) return 'daily'
  return 'monthly'
}

// ---------------------------------------------------------------------------
// OAuth client factory
// ---------------------------------------------------------------------------

function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI ?? 'http://localhost:3000/api/gmail/callback'
  )
}

// ---------------------------------------------------------------------------
// GET /gmail/status?user_id=<privy_did>
// ---------------------------------------------------------------------------

app.get('/status', async (c) => {
  const userId = c.req.query('user_id') ?? c.req.header('x-user-id')
  if (!userId) return c.json({ error: 'user_id required' }, 400)
  const connected = await hasGmailConnected(userId)
  return c.json({ connected })
})

// ---------------------------------------------------------------------------
// GET /gmail/auth?user_id=<privy_did>
// Redirects to Google consent screen. user_id passed as OAuth state.
// ---------------------------------------------------------------------------

app.get('/auth', (c) => {
  const userId = c.req.query('user_id')
  if (!userId) return c.json({ error: 'user_id required' }, 400)

  if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET) {
    return c.json(
      { error: 'Gmail OAuth not configured. Add GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET to server/.env.' },
      503
    )
  }

  const oauth2Client = getOAuthClient()
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // force consent to always get refresh_token
    scope: ['https://www.googleapis.com/auth/gmail.readonly'],
    state: userId,
  })

  return c.redirect(authUrl)
})

// ---------------------------------------------------------------------------
// GET /gmail/callback?code=<code>&state=<privy_did>
// Exchanges auth code for tokens, stores refresh token, redirects to dashboard.
// ---------------------------------------------------------------------------

app.get('/callback', async (c) => {
  const code = c.req.query('code')
  const userId = c.req.query('state')
  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000'

  if (!code || !userId) {
    return c.redirect(`${frontendUrl}/dashboard?error=oauth_failed`)
  }

  try {
    const oauth2Client = getOAuthClient()
    const { tokens } = await oauth2Client.getToken(code)

    if (!tokens.refresh_token) {
      // refresh_token only comes on first consent — prompt: 'consent' above ensures this
      return c.redirect(`${frontendUrl}/dashboard?error=no_refresh_token`)
    }

    await getOrCreateUser(userId)
    await storeGmailTokens(userId, {
      refresh_token: tokens.refresh_token,
      access_token: tokens.access_token ?? undefined,
    })

    return c.redirect(`${frontendUrl}/dashboard?connected=gmail`)
  } catch (err) {
    console.error('[Gmail OAuth] Callback error:', (err as Error).message)
    return c.redirect(`${frontendUrl}/dashboard?error=oauth_failed`)
  }
})

// ---------------------------------------------------------------------------
// POST /gmail/scan
// Fetches Gmail messages, runs parser, creates subscription records.
// Rate-limited to once per 10 min per user via Redis lock.
// ---------------------------------------------------------------------------

app.post('/scan', async (c) => {
  const userId = c.req.header('x-user-id')
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)

  const acquired = await getScanLock(userId)
  if (!acquired) {
    return c.json({ error: 'Scan already in progress. Try again in 10 minutes.' }, 429)
  }

  const dbUserId = await getOrCreateUser(userId)
  const tokens = await getGmailTokens(userId)
  if (!tokens?.refresh_token) {
    return c.json({ error: 'Gmail not connected', code: 'GMAIL_NOT_CONNECTED' }, 400)
  }

  try {
    const oauth2Client = getOAuthClient()
    oauth2Client.setCredentials(tokens)

    // Refresh access token if needed
    oauth2Client.on('tokens', async (newTokens) => {
      if (newTokens.refresh_token) {
        await storeGmailTokens(userId, {
          refresh_token: newTokens.refresh_token,
          access_token: newTokens.access_token ?? undefined,
        })
      }
    })

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

    const listRes = await gmail.users.messages.list({
      userId: 'me',
      q: 'subject:receipt OR subject:invoice OR subject:subscription OR subject:billing OR subject:renewal OR subject:"payment confirmed" OR subject:"auto-renewal"',
      maxResults: 100,
    })

    const messages = listRes.data.messages ?? []
    let detected = 0
    let created = 0
    let updated = 0

    for (const msg of messages) {
      if (!msg.id) continue

      const full = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'metadata',
        metadataHeaders: ['Subject', 'From', 'Date'],
      })

      const headers = full.data.payload?.headers ?? []
      const subject = headers.find((h) => h.name === 'Subject')?.value ?? ''
      const from = headers.find((h) => h.name === 'From')?.value ?? ''
      const date = headers.find((h) => h.name === 'Date')?.value ?? new Date().toISOString()
      const snippet = full.data.snippet ?? ''

      if (!isSubscriptionEmail(subject, from)) continue
      detected++

      // Strip display name, keep only domain/address portion for normalization
      const fromClean = from.replace(/^.*</, '').replace(/>.*$/, '').trim()
      const merchant = normalizeMerchant(fromClean || from)
      const amount = extractAmount(subject + ' ' + snippet)
      const cadence = detectCadence(subject)

      if (!amount) continue

      const existingRows = await sql`
        SELECT id FROM subscriptions
        WHERE user_id = ${dbUserId} AND merchant = ${merchant} AND status = 'active'
        LIMIT 1
      `

      if (existingRows.length > 0) {
        await sql`UPDATE subscriptions SET last_charged = ${date} WHERE id = ${existingRows[0].id}`
        updated++
      } else {
        await sql`
          INSERT INTO subscriptions (user_id, name, merchant, amount, cadence, source, detected_at, last_charged)
          VALUES (${dbUserId}, ${merchant}, ${merchant}, ${amount}, ${cadence}, 'gmail', NOW(), ${date})
        `
        created++
      }
    }

    return c.json({ scanned: messages.length, detected, created, updated })
  } catch (err) {
    console.error('[Gmail] Scan error:', err)
    return c.json({ error: 'Scan failed', detail: (err as Error).message }, 500)
  }
})

// ---------------------------------------------------------------------------
// POST /gmail/parse — manual single-email parse (for testing)
// ---------------------------------------------------------------------------

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

  const dbUserId = await getOrCreateUser(userId)

  const existingRows = await sql`
    SELECT id FROM subscriptions
    WHERE user_id = ${dbUserId} AND merchant = ${merchant} AND status = 'active'
    LIMIT 1
  `

  if (existingRows.length > 0) {
    await sql`UPDATE subscriptions SET last_charged = ${body.received_at} WHERE id = ${existingRows[0].id}`
    return c.json({ detected: true, action: 'updated', subscription_id: existingRows[0].id })
  }

  const created = await sql`
    INSERT INTO subscriptions (user_id, name, merchant, amount, cadence, source, detected_at, last_charged)
    VALUES (${dbUserId}, ${merchant}, ${merchant}, ${amount}, ${cadence}, 'gmail', NOW(), ${body.received_at})
    RETURNING id
  `

  return c.json({ detected: true, action: 'created', subscription_id: created[0].id })
})

export default app
