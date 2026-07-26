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

function normalizeField<T extends Record<string, unknown>>(raw: T, field: keyof T, fallback: number | null = 0): T {
  return {
    ...raw,
    [field]: typeof fallback === 'number' ? num(raw[field], fallback) : numOrNull(raw[field]),
  } as T
}

export function normalizeSubscription<T extends Record<string, unknown>>(raw: T): T {
  return normalizeField(normalizeField(raw, 'amount'), 'confidence', null) as T
}

export function normalizeRec<T extends Record<string, unknown>>(raw: T): T {
  return normalizeField(normalizeField(raw, 'amount'), 'confidence') as T
}

export function normalizeAction<T extends Record<string, unknown>>(raw: T): T {
  return normalizeField(raw, 'amount') as T
}