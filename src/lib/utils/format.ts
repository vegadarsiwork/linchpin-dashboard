// Number / currency / percent formatters — Indian locale.

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const inrCompactFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  notation: 'compact',
  maximumFractionDigits: 1,
})

const numberFormatter = new Intl.NumberFormat('en-IN')
const compactNumberFormatter = new Intl.NumberFormat('en-IN', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

export function formatINR(value: number | null | undefined, opts?: { compact?: boolean }): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return opts?.compact
    ? inrCompactFormatter.format(value)
    : inrFormatter.format(value)
}

export function formatNumber(value: number | null | undefined, opts?: { compact?: boolean }): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return opts?.compact
    ? compactNumberFormatter.format(value)
    : numberFormatter.format(value)
}

export function formatPercent(value: number | null | undefined, opts?: { decimals?: number }): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  const d = opts?.decimals ?? 1
  return `${value.toFixed(d)}%`
}

export function formatChange(change: number | null | undefined): string {
  if (change === null || change === undefined || Number.isNaN(change)) return '—'
  const sign = change > 0 ? '+' : ''
  return `${sign}${change.toFixed(1)}%`
}
