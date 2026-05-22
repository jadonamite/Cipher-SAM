import { Hono } from 'hono'
import { google } from 'googleapis'
import type { gmail_v1 } from 'googleapis'
import { sql, getOrCreateUser } from '../lib/db.js'
import {
  getScanLock,
  releaseScanLock,
  storeGmailTokens,
  getGmailTokens,
  hasGmailConnected,
} from '../lib/cache.js'

const app = new Hono()

// ---------------------------------------------------------------------------
// Merchant normalization
// ---------------------------------------------------------------------------

const MERCHANT_MAP: Record<string, string> = {
  // Streaming
  'netflix.com': 'Netflix',
  'nflx.com': 'Netflix',
  'spotify.com': 'Spotify',
  'spotify.ab': 'Spotify',
  'emails.spotify.com': 'Spotify',
  'hulu.com': 'Hulu',
  'disneyplus.com': 'Disney+',
  'disneyplus': 'Disney+',
  'primevideo.com': 'Amazon Prime Video',
  'amazon.com': 'Amazon',
  'prime video': 'Amazon Prime Video',
  'youtube.com': 'YouTube Premium',
  'youtube premium': 'YouTube Premium',
  'dazn.com': 'DAZN',
  'peacocktv.com': 'Peacock',
  'hbomax.com': 'Max',
  'max.com': 'Max',
  'paramountplus.com': 'Paramount+',
  'showtime.com': 'Showtime',
  'appletv.apple.com': 'Apple TV+',
  // Design & Productivity
  'figma.com': 'Figma',
  'notion.so': 'Notion AI',
  'notion.com': 'Notion AI',
  'notion labs': 'Notion AI',
  'airtable.com': 'Airtable',
  'canva.com': 'Canva',
  'miro.com': 'Miro',
  'linear.app': 'Linear',
  'loom.com': 'Loom',
  'grammarly.com': 'Grammarly',
  'typeform.com': 'Typeform',
  'webflow.com': 'Webflow',
  'framer.com': 'Framer',
  // Dev Tools & Cloud
  'github.com': 'GitHub',
  'github copilot': 'GitHub Copilot',
  'vercel.com': 'Vercel',
  'render.com': 'Render',
  'railway.app': 'Railway',
  'supabase.io': 'Supabase',
  'supabase.com': 'Supabase',
  'planetscale': 'PlanetScale',
  'aws.amazon.com': 'AWS',
  'amazon web services': 'AWS',
  'google cloud': 'Google Cloud',
  'cloud.google.com': 'Google Cloud',
  'digitalocean.com': 'DigitalOcean',
  'heroku.com': 'Heroku',
  'netlify.com': 'Netlify',
  'fly.io': 'Fly.io',
  'linode.com': 'Akamai/Linode',
  'neon.tech': 'Neon',
  'upstash.com': 'Upstash',
  // AI Tools
  'openai.com': 'ChatGPT Plus',
  'chat.openai.com': 'ChatGPT Plus',
  'chatgpt': 'ChatGPT Plus',
  'anthropic.com': 'Claude Pro',
  'midjourney': 'Midjourney',
  'elevenlabs.io': 'ElevenLabs',
  'perplexity.ai': 'Perplexity Pro',
  'gamma.app': 'Gamma',
  // Communication & Productivity
  'slack.com': 'Slack',
  'zoom.us': 'Zoom',
  'dropbox.com': 'Dropbox',
  'box.com': 'Box',
  'evernote.com': 'Evernote',
  'todoist.com': 'Todoist',
  'asana.com': 'Asana',
  'monday.com': 'Monday.com',
  'clickup.com': 'ClickUp',
  'trello.com': 'Trello',
  // Marketing & Analytics
  'mailchimp.com': 'Mailchimp',
  'convertkit.com': 'ConvertKit',
  'zapier.com': 'Zapier',
  'make.com': 'Make',
  'mixpanel.com': 'Mixpanel',
  'amplitude.com': 'Amplitude',
  'hotjar.com': 'Hotjar',
  'semrush.com': 'SEMrush',
  'ahrefs.com': 'Ahrefs',
  // Finance & Payments
  'paypal.com': 'PayPal',
  'stripe.com': 'Stripe',
  'paystack.com': 'Paystack',
  'flutterwave.com': 'Flutterwave',
  'moniepoint.com': 'Moniepoint',
  'opay.com': 'OPay',
  'kuda.com': 'Kuda',
  'piggyvest.com': 'PiggyVest',
  'cowrywise.com': 'Cowrywise',
  'lemonsqueezy.com': 'Lemon Squeezy',
  'paddle.com': 'Paddle',
  'gumroad.com': 'Gumroad',
  // Apple & Google
  'apple.com': 'Apple',
  'icloud.com': 'iCloud',
  'apps.apple.com': 'App Store',
  'microsoft.com': 'Microsoft',
  'office365': 'Microsoft 365',
  'office.com': 'Microsoft 365',
  'adobe.com': 'Adobe Creative Cloud',
  'google.com': 'Google',
  'accounts.google.com': 'Google',
  // Education
  'duolingo.com': 'Duolingo',
  'coursera.org': 'Coursera',
  'udemy.com': 'Udemy',
  'skillshare.com': 'Skillshare',
  'masterclass.com': 'MasterClass',
  'brilliant.org': 'Brilliant',
  'leetcode.com': 'LeetCode',
  // Music
  'apple.com/itunes': 'Apple Music',
  'tidal.com': 'TIDAL',
  'deezer.com': 'Deezer',
  // VPN & Security
  'nordvpn.com': 'NordVPN',
  'expressvpn.com': 'ExpressVPN',
  'protonvpn.com': 'ProtonVPN',
  'proton.me': 'Proton',
  '1password.com': '1Password',
  'bitwarden.com': 'Bitwarden',
  // Storage
  'backblaze.com': 'Backblaze',
  'pcloud.com': 'pCloud',
  // Misc
  'medium.com': 'Medium',
  'substack.com': 'Substack',
  'patreon.com': 'Patreon',
  'twitch.tv': 'Twitch',
  'discord.com': 'Discord Nitro',
  'duolingo': 'Duolingo',
}

function extractRootDomain(email: string): string {
  // Strip display name: "Netflix <no-reply@netflix.com>" → "no-reply@netflix.com"
  const address = email.replace(/^.*</, '').replace(/>.*$/, '').trim().toLowerCase()
  const domainMatch = address.match(/@([\w.-]+\.\w+)/)
  return domainMatch ? domainMatch[1] : address
}

export function normalizeMerchant(raw: string): string {
  const lower = raw.toLowerCase()

  // Direct map check (keys including subdomains)
  for (const [key, name] of Object.entries(MERCHANT_MAP)) {
    if (lower.includes(key)) return name
  }

  // Root domain extraction for sender emails — e.g. "billing@emails.spotify.com" → "spotify.com"
  const domain = extractRootDomain(raw)
  const parts = domain.split('.')
  if (parts.length >= 2) {
    const rootDomain = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`
    for (const [key, name] of Object.entries(MERCHANT_MAP)) {
      if (key.includes(rootDomain) || rootDomain.includes(key.split('.')[0])) return name
    }
  }

  // Fallback: title-case the raw string
  return raw
    .replace(/<.*>/, '')
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

// ---------------------------------------------------------------------------
// Email detection helpers
// ---------------------------------------------------------------------------

const SUB_SUBJECT_PATTERNS = [
  // Generic payment/receipt patterns
  /receipt from/i,
  /invoice from/i,
  /payment receipt/i,
  /payment confirmed/i,
  /payment processed/i,
  /payment successful/i,
  /successfully charged/i,
  /billing confirmation/i,
  /order confirmation/i,
  /order receipt/i,
  /purchase confirmation/i,
  /transaction receipt/i,
  /transaction successful/i,
  /transaction complete/i,
  // Subscription specific
  /your .+ subscription/i,
  /subscription (renewed|active|confirmed|receipt|reminder|invoice)/i,
  /subscription to .+/i,
  /auto.?renew/i,
  /renewal (notice|confirmation|receipt)/i,
  /renewal of .+/i,
  /your .+ plan/i,
  /your plan (has been|is)/i,
  /plan (renewed|renewal|receipt|invoice)/i,
  /membership (renewed|renewal|receipt|active|charge)/i,
  /trial (ending|ended|expires|expired|ending soon)/i,
  /trial period/i,
  /free trial/i,
  // Thank you patterns
  /thanks? for (your )?(payment|subscription|purchase|order)/i,
  /thank you for (your )?(payment|subscription|subscribing|purchase)/i,
  /you've been (charged|billed)/i,
  /we'?ve (charged|billed)/i,
  /we charged your/i,
  // Charge/debit patterns
  /charged .+\$/i,
  /charged .+₦/i,
  /\$\d+ (charge|debit|billed)/i,
  /₦[\d,]+ (charge|debit)/i,
  /debit alert/i,
  /debit notification/i,
  // Service specific patterns
  /your (netflix|spotify|apple|google|microsoft|amazon|adobe|slack|zoom|figma|notion|github|dropbox|paypal) (receipt|invoice|subscription|payment|membership|plan|charge)/i,
  // Upcoming/renewal alerts
  /upcoming (charge|renewal|payment|billing)/i,
  /reminder.*(subscription|renewal|payment)/i,
  /(subscription|renewal|payment).*reminder/i,
  // Plan continuation
  /your (access|service|account) (continues?|is active|renewed)/i,
  /access to .+ (continues?|renewed)/i,
]

const KNOWN_BILLING_DOMAINS = new Set([
  'netflix.com', 'spotify.com', 'apple.com', 'google.com', 'microsoft.com',
  'amazon.com', 'adobe.com', 'figma.com', 'notion.so', 'notion.com',
  'github.com', 'dropbox.com', 'slack.com', 'zoom.us', 'paypal.com',
  'stripe.com', 'paystack.com', 'flutterwave.com', 'canva.com', 'loom.com',
  'grammarly.com', 'duolingo.com', 'openai.com', 'anthropic.com', 'vercel.com',
  'digitalocean.com', 'airtable.com', 'zapier.com', 'mailchimp.com',
  'linear.app', 'miro.com', 'webflow.com', 'framer.com', 'render.com',
  'railway.app', 'heroku.com', 'netlify.com', 'medium.com', 'substack.com',
  'patreon.com', 'discord.com', 'twitch.tv', 'nordvpn.com', 'expressvpn.com',
  'protonvpn.com', 'proton.me', '1password.com', 'coursera.org', 'udemy.com',
  'skillshare.com', 'midjourney.com', 'elevenlabs.io', 'perplexity.ai',
  'paddle.com', 'lemonsqueezy.com', 'gumroad.com',
])

// Subjects that indicate non-billing emails even from known billing domains
const NEGATIVE_SUBJECT_PATTERNS = [
  /deployment (failed|succeeded|cancelled|completed)/i,
  /build (failed|succeeded|cancelled|error)/i,
  /filling out.*form/i,
  /form.*receipt/i,
  /hackathon/i,
  /security alert/i,
  /new sign.?in/i,
  /password (reset|changed)/i,
  /verify your email/i,
  /welcome to/i,
  /account (created|confirmed|verified)/i,
  /notification settings/i,
  /unsubscribe/i,
]

export function isSubscriptionEmail(subject: string, sender: string): boolean {
  // Hard reject non-billing subjects even from billing domains
  if (NEGATIVE_SUBJECT_PATTERNS.some((p) => p.test(subject))) return false

  // 1. Subject pattern match
  if (SUB_SUBJECT_PATTERNS.some((p) => p.test(subject))) return true

  // 2. Sender is a known billing domain — only accept if subject looks billing-adjacent
  const senderLower = sender.toLowerCase()
  const domain = extractRootDomain(senderLower)
  const parts = domain.split('.')
  if (parts.length >= 2) {
    const rootDomain = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`
    if (KNOWN_BILLING_DOMAINS.has(rootDomain)) {
      // Require at least a weak billing signal in the subject
      const billingHint = /receipt|invoice|subscription|billing|charge|payment|renewal|plan|membership|trial|order|debit/i
      return billingHint.test(subject)
    }
  }

  return false
}

// Multi-currency amount extraction
export function extractAmount(text: string): { amount: number; currency: string } | null {
  // USD: $15.99 / $1,500.00 / USD 15.99
  const usd =
    text.match(/\$\s?(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)/i) ||
    text.match(/USD\s?(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)/i)
  if (usd) return { amount: parseFloat(usd[1].replace(/,/g, '')), currency: 'USD' }

  // NGN: ₦1,500 / NGN 1500
  const ngn =
    text.match(/₦\s?(\d{1,7}(?:,\d{3})*(?:\.\d{2})?)/i) ||
    text.match(/NGN\s?(\d{1,7}(?:,\d{3})*(?:\.\d{2})?)/i)
  if (ngn) return { amount: parseFloat(ngn[1].replace(/,/g, '')), currency: 'NGN' }

  // EUR: €15.99 / EUR 15.99
  const eur =
    text.match(/€\s?(\d{1,4}(?:[.,]\d{3})*(?:[.,]\d{2})?)/i) ||
    text.match(/EUR\s?(\d{1,4}(?:[.,]\d{2})?)/i)
  if (eur) return { amount: parseFloat(eur[1].replace(/,/g, '').replace(/\.(?=\d{3})/g, '')), currency: 'EUR' }

  // GBP: £15.99 / GBP 15.99
  const gbp =
    text.match(/£\s?(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)/i) ||
    text.match(/GBP\s?(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)/i)
  if (gbp) return { amount: parseFloat(gbp[1].replace(/,/g, '')), currency: 'GBP' }

  return null
}

export function detectCadence(subject: string): 'monthly' | 'yearly' | 'weekly' | 'daily' {
  if (/annual|yearly|year/i.test(subject)) return 'yearly'
  if (/weekly|week/i.test(subject)) return 'weekly'
  if (/daily|day/i.test(subject)) return 'daily'
  return 'monthly'
}

// ---------------------------------------------------------------------------
// Email body extraction
// ---------------------------------------------------------------------------

function decodeBase64Url(encoded: string): string {
  return Buffer.from(encoded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim()
}

function extractBodyFromParts(parts: gmail_v1.Schema$MessagePart[]): string {
  let plainText = ''
  let htmlText = ''
  for (const part of parts) {
    if (part.mimeType === 'text/plain' && part.body?.data) {
      plainText += decodeBase64Url(part.body.data) + '\n'
    } else if (part.mimeType === 'text/html' && part.body?.data) {
      htmlText += decodeBase64Url(part.body.data) + '\n'
    } else if (part.parts) {
      plainText += extractBodyFromParts(part.parts)
    }
  }
  return plainText || (htmlText ? stripHtml(htmlText) : '')
}

function getEmailBody(payload: gmail_v1.Schema$MessagePart): string {
  if (payload.body?.data) {
    const raw = decodeBase64Url(payload.body.data)
    return payload.mimeType === 'text/html' ? stripHtml(raw) : raw
  }
  if (payload.parts) return extractBodyFromParts(payload.parts)
  return ''
}

// ---------------------------------------------------------------------------
// OAuth client factory
// ---------------------------------------------------------------------------

function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI ?? 'http://localhost:3001/gmail/callback'
  )
}

// ---------------------------------------------------------------------------
// GET /gmail/status
// ---------------------------------------------------------------------------

app.get('/status', async (c) => {
  const userId = c.req.query('user_id') ?? c.req.header('x-user-id')
  if (!userId) return c.json({ error: 'user_id required' }, 400)
  const connected = await hasGmailConnected(userId)
  return c.json({ connected })
})

// ---------------------------------------------------------------------------
// GET /gmail/auth
// ---------------------------------------------------------------------------

app.get('/auth', (c) => {
  const userId = c.req.query('user_id')
  if (!userId) return c.json({ error: 'user_id required' }, 400)

  if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET) {
    return c.json(
      { error: 'Gmail OAuth not configured.' },
      503
    )
  }

  const oauth2Client = getOAuthClient()
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/gmail.readonly'],
    state: userId,
  })

  return c.redirect(authUrl)
})

// ---------------------------------------------------------------------------
// GET /gmail/callback
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
// POST /gmail/scan — main detection pipeline
// ---------------------------------------------------------------------------

const GMAIL_QUERY = [
  'subject:receipt',
  'subject:invoice',
  'subject:subscription',
  'subject:billing',
  'subject:renewal',
  'subject:"payment confirmed"',
  'subject:"payment receipt"',
  'subject:"payment processed"',
  'subject:"payment successful"',
  'subject:"successfully charged"',
  'subject:"auto-renewal"',
  'subject:"order confirmation"',
  'subject:"transaction receipt"',
  'subject:"debit alert"',
  'subject:"debit notification"',
  'subject:"membership"',
  'subject:"your plan"',
  'subject:"trial ending"',
  'subject:"thanks for subscribing"',
  'subject:"thank you for your payment"',
  'subject:"we charged"',
  'subject:"you have been charged"',
  // Catch known billing senders directly
  'from:netflix.com',
  'from:spotify.com',
  'from:apple.com',
  'from:google.com',
  'from:amazon.com',
  'from:paypal.com',
  'from:stripe.com',
  'from:paystack.com',
  'from:flutterwave.com',
  'from:figma.com',
  'from:notion.so',
  'from:github.com',
  'from:adobe.com',
  'from:slack.com',
  'from:zoom.us',
  'from:openai.com',
  'from:vercel.com',
  'from:digitalocean.com',
  'from:anthropic.com',
  'from:midjourney.com',
  'from:loom.com',
  'from:canva.com',
  'from:grammarly.com',
  'from:dropbox.com',
  'from:microsoft.com',
  'from:paddle.com',
  'from:lemonsqueezy.com',
  'from:gumroad.com',
].join(' OR ')

const MAX_RESULTS = 200
const BATCH_SIZE = 15

app.post('/scan', async (c) => {
  const userId = c.req.header('x-user-id')
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)

  const debug = c.req.query('debug') === '1'
  const t0 = Date.now()
  const log = (...args: unknown[]) => console.log('[gmail/scan]', ...args)

  const acquired = await getScanLock(userId)
  if (!acquired) {
    return c.json({ error: 'Scan already in progress. Try again in 2 minutes.' }, 429)
  }

  const dbUserId = await getOrCreateUser(userId)
  const tokens = await getGmailTokens(userId)
  if (!tokens?.refresh_token) {
    await releaseScanLock(userId)
    return c.json({ error: 'Gmail not connected', code: 'GMAIL_NOT_CONNECTED' }, 400)
  }

  log('start', { userId, dbUserId, hasAccessToken: !!tokens.access_token, query_len: GMAIL_QUERY.length })

  try {
    const oauth2Client = getOAuthClient()
    oauth2Client.setCredentials(tokens)

    oauth2Client.on('tokens', async (newTokens) => {
      if (newTokens.refresh_token) {
        await storeGmailTokens(userId, {
          refresh_token: newTokens.refresh_token,
          access_token: newTokens.access_token ?? undefined,
        })
      }
    })

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

    // --- Paginated message fetch ---
    const allMessages: gmail_v1.Schema$Message[] = []
    let pageToken: string | undefined
    let pages = 0
    const queryWithScope = `${GMAIL_QUERY} newer_than:1y`

    do {
      const listRes = await gmail.users.messages.list({
        userId: 'me',
        q: queryWithScope,
        maxResults: 100,
        ...(pageToken ? { pageToken } : {}),
      })
      const msgs = listRes.data.messages ?? []
      allMessages.push(...msgs)
      pageToken = listRes.data.nextPageToken ?? undefined
      pages++
      log('list', { page: pages, got: msgs.length, total: allMessages.length, resultSizeEstimate: listRes.data.resultSizeEstimate })
    } while (pageToken && allMessages.length < MAX_RESULTS)

    const listElapsed = Date.now() - t0

    let detected = 0
    let created = 0
    let updated = 0
    let noAmount = 0
    let fetchErrors = 0
    let dbErrors = 0
    const rejectedSamples: Array<{ subject: string; from: string }> = []
    const acceptedSamples: Array<{ subject: string; from: string; merchant: string; amount: number; currency: string }> = []

    // --- Process in parallel batches, with hard time budget ---
    const TIME_BUDGET_MS = 50_000
    let timedOut = false
    let processed = 0

    for (let i = 0; i < allMessages.length; i += BATCH_SIZE) {
      if (Date.now() - t0 > TIME_BUDGET_MS) {
        timedOut = true
        log('time-budget-exceeded', { processed, total: allMessages.length })
        break
      }
      const batch = allMessages.slice(i, i + BATCH_SIZE)

      await Promise.all(
        batch.map(async (msg) => {
          if (!msg.id) return
          processed++

          let full
          try {
            full = await gmail.users.messages.get({
              userId: 'me',
              id: msg.id,
              format: 'full',
            })
          } catch (e) {
            fetchErrors++
            log('fetch-error', { id: msg.id, err: (e as Error).message })
            return
          }

          const headers = full.data.payload?.headers ?? []
          const subject = headers.find((h) => h.name === 'Subject')?.value ?? ''
          const from = headers.find((h) => h.name === 'From')?.value ?? ''
          const dateRaw = headers.find((h) => h.name === 'Date')?.value ?? ''
          const parsedDate = dateRaw ? new Date(dateRaw) : null
          const date = parsedDate && !isNaN(parsedDate.getTime())
            ? parsedDate.toISOString()
            : new Date().toISOString()
          const snippet = full.data.snippet ?? ''

          if (!isSubscriptionEmail(subject, from)) {
            if (rejectedSamples.length < 10) rejectedSamples.push({ subject, from })
            return
          }
          detected++

          const body = full.data.payload ? getEmailBody(full.data.payload) : ''
          const searchText = `${subject} ${snippet} ${body}`.slice(0, 4000)
          const amountResult = extractAmount(searchText)

          const fromClean = from.replace(/^.*</, '').replace(/>.*$/, '').trim()
          const merchant = normalizeMerchant(fromClean || from)
          const cadence = detectCadence(subject)
          const amount = amountResult?.amount ?? 0
          const currency = amountResult?.currency ?? 'USD'

          if (!amountResult) noAmount++
          if (acceptedSamples.length < 10) {
            acceptedSamples.push({ subject, from, merchant, amount, currency })
          }

          try {
            const existingRows = await sql`
              SELECT id FROM subscriptions
              WHERE user_id = ${dbUserId} AND merchant = ${merchant} AND status = 'active'
              LIMIT 1
            `

            if (existingRows.length > 0) {
              if (amountResult) {
                await sql`
                  UPDATE subscriptions
                  SET last_charged = ${date}, amount = ${amount}, currency = ${currency}
                  WHERE id = ${existingRows[0].id}
                `
              } else {
                await sql`UPDATE subscriptions SET last_charged = ${date} WHERE id = ${existingRows[0].id}`
              }
              updated++
            } else {
              await sql`
                INSERT INTO subscriptions
                  (user_id, name, merchant, amount, currency, cadence, source, detected_at, last_charged)
                VALUES
                  (${dbUserId}, ${merchant}, ${merchant}, ${amount}, ${currency}, ${cadence}, 'gmail', NOW(), ${date})
              `
              created++
            }
          } catch (e) {
            dbErrors++
            log('db-error', { merchant, err: (e as Error).message })
          }
        })
      )
    }

    await releaseScanLock(userId)
    const elapsed = Date.now() - t0
    log('done', { scanned: allMessages.length, processed, detected, created, updated, noAmount, fetchErrors, dbErrors, timedOut, listElapsed, elapsed })

    const response: Record<string, unknown> = {
      scanned: allMessages.length,
      processed,
      detected,
      created,
      updated,
      no_amount: noAmount,
      fetch_errors: fetchErrors,
      db_errors: dbErrors,
      timed_out: timedOut,
      elapsed_ms: elapsed,
    }
    if (debug) {
      response.debug = {
        query: queryWithScope,
        query_len: queryWithScope.length,
        pages,
        list_elapsed_ms: listElapsed,
        rejected_samples: rejectedSamples,
        accepted_samples: acceptedSamples,
      }
    }
    return c.json(response)
  } catch (err) {
    await releaseScanLock(userId)
    console.error('[gmail/scan] fatal:', err)
    return c.json({ error: 'Scan failed', detail: (err as Error).message }, 500)
  }
})

// DELETE /gmail/scan-lock — clear stuck scan lock (debug)
app.delete('/scan-lock', async (c) => {
  const userId = c.req.header('x-user-id')
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)
  await releaseScanLock(userId)
  return c.json({ cleared: true })
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
  const amountResult = extractAmount(`${body.subject} ${body.body_snippet}`)
  const cadence = detectCadence(body.subject)

  const dbUserId = await getOrCreateUser(userId)

  const existingRows = await sql`
    SELECT id FROM subscriptions
    WHERE user_id = ${dbUserId} AND merchant = ${merchant} AND status = 'active'
    LIMIT 1
  `

  const amount = amountResult?.amount ?? 0
  const currency = amountResult?.currency ?? 'USD'

  if (existingRows.length > 0) {
    await sql`UPDATE subscriptions SET last_charged = ${body.received_at} WHERE id = ${existingRows[0].id}`
    return c.json({ detected: true, action: 'updated', subscription_id: existingRows[0].id })
  }

  const created = await sql`
    INSERT INTO subscriptions (user_id, name, merchant, amount, currency, cadence, source, detected_at, last_charged)
    VALUES (${dbUserId}, ${merchant}, ${merchant}, ${amount}, ${currency}, ${cadence}, 'gmail', NOW(), ${body.received_at})
    RETURNING id
  `

  return c.json({ detected: true, action: 'created', subscription_id: created[0].id })
})

export default app
