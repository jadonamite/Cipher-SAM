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

function normalizeProperties<T extends Record<string, unknown>>(raw: T, properties: { [key: string]: (value: unknown) => unknown }): T {
  return { ...raw, ...Object.fromEntries(Object.entries(properties).map(([key, fn]) => [key, fn(raw[key])])) }
}

export function normalizeSubscription<T extends Record<string, unknown>>(raw: T): T {
  return normalizeProperties(raw, {
    amount: (value) => num(value),
    confidence: (value) => numOrNull(value),
  }) as T
}

export function normalizeRec<T extends Record<string, unknown>>(raw: T): T {
  return normalizeProperties(raw, {
    amount: (value) => num(value),
    confidence: (value) => num(value),
  }) as T
}

export function normalizeAction<T extends Record<string, unknown>>(raw: T): T {
  return normalizeProperties(raw, {
    amount: (value) => num(value),
  }) as T
}