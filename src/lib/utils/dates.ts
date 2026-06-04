// Date helpers — relative time, formatting, urgency checks.

export function relativeTime(input: string | Date | null | undefined): string {
  if (!input) return ''
  const date = typeof input === 'string' ? new Date(input) : input
  const now = Date.now()
  const diffMs = now - date.getTime()
  const diffSec = Math.round(diffMs / 1000)
  const diffMin = Math.round(diffSec / 60)
  const diffHr = Math.round(diffMin / 60)
  const diffDay = Math.round(diffHr / 24)

  if (diffSec < 0) return 'just now'
  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay === 1) return 'Yesterday'
  if (diffDay < 7) return `${diffDay} days ago`

  return formatDate(date)
}

export function formatDate(input: string | Date): string {
  const date = typeof input === 'string' ? new Date(input) : input
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateShort(input: string | Date): string {
  const date = typeof input === 'string' ? new Date(input) : input
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export type DueState = {
  label: string
  urgency: 'normal' | 'soon' | 'today' | 'overdue'
}

export function dueState(due: string | Date | null | undefined): DueState | null {
  if (!due) return null
  const dueDate = typeof due === 'string' ? new Date(due) : due

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const target = new Date(dueDate)
  target.setHours(0, 0, 0, 0)

  const diffDays = Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (diffDays < 0) {
    const n = Math.abs(diffDays)
    return {
      label: `Overdue by ${n} day${n === 1 ? '' : 's'}`,
      urgency: 'overdue',
    }
  }
  if (diffDays === 0) return { label: 'Due today', urgency: 'today' }
  if (diffDays === 1) return { label: 'Due tomorrow', urgency: 'soon' }
  return { label: `Due in ${diffDays} days`, urgency: 'normal' }
}

export function isDueUrgent(due: string | Date | null | undefined): boolean {
  const s = dueState(due)
  return s ? s.urgency === 'today' || s.urgency === 'overdue' : false
}
