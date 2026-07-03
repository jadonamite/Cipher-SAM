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

function normalizeFields<T extends Record<string, unknown>>(raw: T, fields: { [key: string]: (value: unknown) => unknown }): T {
  return { ...raw, ...Object.fromEntries(Object.entries(fields).map(([key, fn]) => [key, fn(raw[key])])) } as T
}

export function normalizeSubscription<T extends Record<string, unknown>>(raw: T): T {
  return normalizeFields(raw, { amount: (value) => num(value), confidence: numOrNull })
}

export function normalizeRec<T extends Record<string, unknown>>(raw: T): T {
  return normalizeFields(raw, { amount: (value) => num(value), confidence: num })
}

export function normalizeAction<T extends Record<string, unknown>>(raw: T): T {
  return normalizeFields(raw, { amount: (value) => num(value) })
}