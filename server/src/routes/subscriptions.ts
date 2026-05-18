import { Hono } from 'hono'
import { sql, getOrCreateUser } from '../lib/db.js'
import { getCachedInsight, setCachedInsight, invalidateInsight } from '../lib/cache.js'
import { generateSubscriptionInsight } from '../lib/ai.js'

const app = new Hono()

app.get('/', async (c) => {
  const userId = c.req.header('x-user-id')
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)

  const dbUserId = await getOrCreateUser(userId)
  const rows = await sql`
    SELECT s.*,
      json_agg(sig ORDER BY sig.created_at DESC) FILTER (WHERE sig.id IS NOT NULL) AS signals,
      json_agg(r ORDER BY r.confidence DESC) FILTER (WHERE r.id IS NOT NULL) AS recommendations
    FROM subscriptions s
    LEFT JOIN signals sig ON sig.subscription_id = s.id
    LEFT JOIN recommendations r ON r.subscription_id = s.id AND r.status = 'pending'
    WHERE s.user_id = ${dbUserId} AND s.status = 'active'
    GROUP BY s.id
    ORDER BY s.amount DESC
  `

  return c.json({ subscriptions: rows })
})

app.get('/:id', async (c) => {
  const userId = c.req.header('x-user-id')
  const { id } = c.req.param()
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)

  const dbUserId = await getOrCreateUser(userId)
  const [sub] = await sql`
    SELECT * FROM subscriptions WHERE id = ${id} AND user_id = ${dbUserId}
  `
  if (!sub) return c.json({ error: 'Not found' }, 404)

  const signals = await sql`
    SELECT * FROM signals WHERE subscription_id = ${id} ORDER BY created_at DESC
  `

  let insight = await getCachedInsight(id)
  if (!insight && signals.length > 0) {
    insight = await generateSubscriptionInsight({
      name: sub.name,
      amount: sub.amount,
      cadence: sub.cadence,
      signals: signals.map((s: any) => `${s.type}: ${s.value}`),
    })
    if (insight) await setCachedInsight(id, insight)
  }

  return c.json({ subscription: sub, signals, insight })
})

app.patch('/:id/status', async (c) => {
  const userId = c.req.header('x-user-id')
  const { id } = c.req.param()
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)

  const { status } = await c.req.json<{ status: string }>()
  if (!['active', 'paused', 'cancelled'].includes(status)) {
    return c.json({ error: 'Invalid status' }, 400)
  }

  const dbUserId = await getOrCreateUser(userId)
  const [updated] = await sql`
    UPDATE subscriptions SET status = ${status}
    WHERE id = ${id} AND user_id = ${dbUserId}
    RETURNING *
  `
  if (!updated) return c.json({ error: 'Not found' }, 404)

  await invalidateInsight(id)
  return c.json({ subscription: updated })
})

export default app
