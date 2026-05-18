import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import subscriptions from './routes/subscriptions.js'
import gmail from './routes/gmail.js'
import intelligence from './routes/intelligence.js'
import wallet from './routes/wallet.js'

const app = new Hono()

app.use('*', logger())
app.use(
  '*',
  cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    allowHeaders: ['Content-Type', 'x-user-id'],
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE'],
  })
)

app.get('/health', (c) => c.json({ status: 'ok', service: 'sam-server' }))

app.route('/subscriptions', subscriptions)
app.route('/gmail', gmail)
app.route('/intelligence', intelligence)
app.route('/wallet', wallet)

const port = Number(process.env.PORT ?? 3001)

serve({ fetch: app.fetch, port }, () => {
  console.log(`SAM server running on http://localhost:${port}`)
})
