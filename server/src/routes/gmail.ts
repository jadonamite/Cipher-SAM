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
import { runAnalyzeAll } from '../lib/scoring.js'
import {
  lookupService,
  REGISTRY_FROM_QUERY,
  type SubscriptionCategory,
} from '../lib/subscriptions-registry.js'

const app = new Hono()

// ---------------------------------------------------------------------------
// Merchant normalization
// ---------------------------------------------------------------------------

function extractRootDomain(email: string): string {
  // Strip display name: "Netflix <no-reply@netflix.com>" → "no-reply@netflix.com"
  const address = email.replace(/^.*</, '').replace(/>.*$/, '').trim().toLowerCase()
  const domainMatch = address.match(/@([\w.-]+\.\w+)/)
  return domainMatch ? domainMatch[1] : address
}

/**
 * Resolve a sender header to {merchant, category}. Uses the subscription
 * registry as the source of truth; falls back to a title-cased version of
 * the display name / domain when the sender is unknown.
 */
export function resolveMerchant(raw: string): { name: string; category: SubscriptionCategory | null } {
  const hit = lookupService(raw)
  if (hit) return { name: hit.name, category: hit.category }

  // Unknown sender — fall back to title-casing the display name or domain
  const displayName = raw.replace(/<.*>/, '').trim()
  if (displayName && !displayName.includes('@')) {
    const cased = displayName
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ')
    return { name: cased, category: null }
  }
  const domain = extractRootDomain(raw)
  const base = domain.split('.')[0] ?? raw
  return { name: base.charAt(0).toUpperCase() + base.slice(1).toLowerCase(), category: null }
}

// Back-compat for callers that only need the name string (e.g. /gmail/parse)
export function normalizeMerchant(raw: string): string {
  return resolveMerchant(raw).name
}

// ---------------------------------------------------------------------------
// Email detection helpers
// ---------------------------------------------------------------------------

// Strict-whitelist detection. A message is only a candidate subscription if its
// sender resolves to an entry in SUBSCRIPTION_REGISTRY. Everything else is
// rejected — including banks, e-commerce, and look-alike billing domains.
// Subject-pattern matching is gone; the registry is the only signal.
export function isSubscriptionEmail(_subject: string, sender: string): boolean {
  return lookupService(sender) !== null
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

// Registry-only Gmail query. Detection is strict-whitelist (see
// isSubscriptionEmail), so there's no point scanning subject-pattern matches —
// they would all be rejected downstream anyway.
const GMAIL_QUERY = REGISTRY_FROM_QUERY

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

          const { name: merchant, category } = resolveMerchant(from)
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
                  SET last_charged = ${date}, amount = ${amount}, currency = ${currency}, category = COALESCE(category, ${category})
                  WHERE id = ${existingRows[0].id}
                `
              } else {
                await sql`UPDATE subscriptions SET last_charged = ${date}, category = COALESCE(category, ${category}) WHERE id = ${existingRows[0].id}`
              }
              updated++
            } else {
              await sql`
                INSERT INTO subscriptions
                  (user_id, name, merchant, amount, currency, cadence, source, category, detected_at, last_charged)
                VALUES
                  (${dbUserId}, ${merchant}, ${merchant}, ${amount}, ${currency}, ${cadence}, 'gmail', ${category}, NOW(), ${date})
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

    // Auto-score all subs now that detection is fresh — no AI calls, just DB writes.
    // Ensures confidence + recommendations are populated immediately after every scan.
    let analyzed = 0
    try {
      analyzed = await runAnalyzeAll(dbUserId)
    } catch (err) {
      log('analyze-all-error', (err as Error).message)
    }

    const elapsed = Date.now() - t0
    log('done', { scanned: allMessages.length, processed, detected, created, updated, analyzed, noAmount, fetchErrors, dbErrors, timedOut, listElapsed, elapsed })

    const response: Record<string, unknown> = {
      scanned: allMessages.length,
      processed,
      detected,
      created,
      updated,
      analyzed,
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

  const { name: merchant, category } = resolveMerchant(body.sender)
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
    await sql`UPDATE subscriptions SET last_charged = ${body.received_at}, category = COALESCE(category, ${category}) WHERE id = ${existingRows[0].id}`
    return c.json({ detected: true, action: 'updated', subscription_id: existingRows[0].id })
  }

  const created = await sql`
    INSERT INTO subscriptions (user_id, name, merchant, amount, currency, cadence, source, category, detected_at, last_charged)
    VALUES (${dbUserId}, ${merchant}, ${merchant}, ${amount}, ${currency}, ${cadence}, 'gmail', ${category}, NOW(), ${body.received_at})
    RETURNING id
  `

  return c.json({ detected: true, action: 'created', subscription_id: created[0].id })
})

export default app
