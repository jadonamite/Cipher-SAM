import { Redis } from '@upstash/redis'

if (!process.env.UPSTASH_REDIS_URL || !process.env.UPSTASH_REDIS_TOKEN) {
  throw new Error('UPSTASH_REDIS_URL and UPSTASH_REDIS_TOKEN are required')
}

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
})

const TTL = {
  insight: 60 * 60 * 6,   // 6h — re-run when new signals arrive
  scan: 60 * 10,           // 10m — rate-limit Gmail scans
}

export async function getCachedInsight(subId: string): Promise<string | null> {
  return redis.get<string>(`insight:${subId}`)
}

export async function setCachedInsight(subId: string, insight: string): Promise<void> {
  await redis.set(`insight:${subId}`, insight, { ex: TTL.insight })
}

export async function getScanLock(userId: string): Promise<boolean> {
  const key = `scan_lock:${userId}`
  const set = await redis.set(key, '1', { ex: TTL.scan, nx: true })
  return set !== null
}

export async function invalidateInsight(subId: string): Promise<void> {
  await redis.del(`insight:${subId}`)
}
