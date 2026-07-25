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

function normalizeNumber<T extends Record<string, unknown>>(raw: T, key: string, fallback?: number): T {
  return {
    ...raw,
    [key]: fallback !== undefined ? num(raw[key], fallback) : numOrNull(raw[key]),
  } as T
}

export function normalizeSubscription<T extends Record<string, unknown>>(raw: T): T {
  return normalizeNumber(normalizeNumber(raw, 'amount'), 'confidence')
}

export function normalizeRec<T extends Record<string, unknown>>(raw: T): T {
  return normalizeNumber(normalizeNumber(raw, 'amount'), 'confidence', 0)
}

export function normalizeAction<T extends Record<string, unknown>>(raw: T): T {
  return normalizeNumber(raw, 'amount')
}