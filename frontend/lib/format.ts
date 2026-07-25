export type Currency = 'USD' | 'NGN' | 'EUR' | 'GBP' | string

const SYMBOLS: Record<string, string> = {
  USD: '$',
  NGN: '₦',
  EUR: '€',
  GBP: '£',
}

// NGN amounts are typically whole-number; everything else gets two decimals.
function decimalsFor(currency: string): number {
  return currency === 'NGN' ? 0 : 2
}

export function formatMoney(amount: number, currency: Currency = 'USD'): string {
  const symbol = SYMBOLS[currency] ?? ''
  const decimals = decimalsFor(currency)
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  if (symbol) return `${symbol}${formatted}`
  return `${formatted} ${currency}`
}

export type CurrencyMap = Record<string, number>

// Sum monthly-equivalent values grouped by currency.
export function aggregateByCurrency<T>(
  items: T[],
  amountFn: (item: T) => number,
  currencyFn: (item: T) => string,
): CurrencyMap {
  const out: CurrencyMap = {}
  for (const item of items) {
    const c = currencyFn(item) || 'USD'
    out[c] = (out[c] ?? 0) + amountFn(item)
  }
  return out
}

function getNonZeroEntries(map: CurrencyMap): [string, number][] {
  return Object.entries(map).filter(([, v]) => v > 0)
}

function getPrimaryCurrency(map: CurrencyMap): string | null {
  const entries = getNonZeroEntries(map)
  if (entries.length === 0) return null
  if (map.USD && map.USD > 0) return 'USD'
  entries.sort((a, b) => b[1] - a[1])
  return entries[0][0]
}

function formatSuffixes(map: CurrencyMap, primary: string): string {
  return Object.entries(map)
    .filter(([c, v]) => c !== primary && v > 0)
    .map(([c, v]) => formatMoney(v, c))
    .join(' + ')
}

// Render the headline amount + every other non-zero currency as a suffix.
// Example: { USD: 42, NGN: 40371 } → "$42.00 + ₦40,371"
export function formatAggregate(map: CurrencyMap): string {
  const primary = getPrimaryCurrency(map)
  if (!primary) return formatMoney(0, 'USD')
  const headline = formatMoney(map[primary], primary)
  const suffixes = formatSuffixes(map, primary)
  if (!suffixes) return headline
  return `${headline} + ${suffixes}`
}
