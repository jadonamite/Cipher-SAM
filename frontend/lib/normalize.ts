function num(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === '') return fallback
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function numOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function normalizeFields<T extends Record<string, unknown>>(raw: T, confidenceFallback: number | null = 0): T {
  return {
    ...raw,
    amount: num(raw.amount),
    confidence: confidenceFallback === null ? numOrNull(raw.confidence) : num(raw.confidence),
  } as T
}

export function normalizeSubscription<T extends Record<string, unknown>>(raw: T): T {
  return normalizeFields(raw, null)
}

export function normalizeRec<T extends Record<string, unknown>>(raw: T): T {
  return normalizeFields(raw)
}

export function normalizeAction<T extends Record<string, unknown>>(raw: T): T {
  return normalizeFields(raw, 0)
}