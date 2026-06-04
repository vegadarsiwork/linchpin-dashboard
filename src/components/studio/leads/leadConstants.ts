// Lead source + follow-up helpers shared across leads UI.

export type LeadSource =
  | 'zap_whatsapp'
  | 'cold_email'
  | 'linkedin'
  | 'landing_page'
  | 'meta_ads'
  | 'reel'
  | 'referral'
  | 'manual'

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'converted'
  | 'lost'

export const LEAD_STATUSES: { key: LeadStatus; label: string }[] = [
  { key: 'new', label: 'New' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'qualified', label: 'Qualified' },
  { key: 'converted', label: 'Converted' },
  { key: 'lost', label: 'Lost' },
]

export const SOURCE_META: Record<
  LeadSource,
  { label: string; bg: string; text: string; ring: string }
> = {
  zap_whatsapp: {
    label: 'Zap WhatsApp',
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    ring: 'ring-emerald-200',
  },
  cold_email: {
    label: 'Cold Email',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    ring: 'ring-blue-200',
  },
  linkedin: {
    label: 'LinkedIn',
    bg: 'bg-indigo-100',
    text: 'text-indigo-700',
    ring: 'ring-indigo-200',
  },
  landing_page: {
    label: 'Landing Page',
    bg: 'bg-teal-100',
    text: 'text-teal-700',
    ring: 'ring-teal-200',
  },
  meta_ads: {
    label: 'Meta Ads',
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    ring: 'ring-orange-200',
  },
  reel: {
    label: 'Reel',
    bg: 'bg-violet-100',
    text: 'text-violet-700',
    ring: 'ring-violet-200',
  },
  referral: {
    label: 'Referral',
    bg: 'bg-pink-100',
    text: 'text-pink-700',
    ring: 'ring-pink-200',
  },
  manual: {
    label: 'Manual',
    bg: 'bg-zinc-100',
    text: 'text-zinc-700',
    ring: 'ring-zinc-200',
  },
}

export function getSourceMeta(source: string | null) {
  if (source && source in SOURCE_META) {
    return SOURCE_META[source as LeadSource]
  }
  return SOURCE_META.manual
}

export type FollowUpState = {
  label: string
  tone: 'overdue' | 'today' | 'tomorrow' | 'future' | 'none'
  date: string | null
}

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function followUpState(
  iso: string | null | undefined
): FollowUpState {
  if (!iso) return { label: '—', tone: 'none', date: null }

  const target = new Date(iso)
  const now = new Date()

  // Past — overdue, regardless of day boundary
  if (target.getTime() < now.getTime()) {
    return {
      label: 'Overdue',
      tone: 'overdue',
      date: target.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
      }),
    }
  }

  const today = startOfDay(now)
  const targetDay = startOfDay(target)
  const diffDays = Math.round(
    (targetDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (diffDays === 0) return { label: 'Today', tone: 'today', date: null }
  if (diffDays === 1)
    return { label: 'Tomorrow', tone: 'tomorrow', date: null }
  return {
    label: `In ${diffDays} days`,
    tone: 'future',
    date: target.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    }),
  }
}

export function followUpToneClasses(tone: FollowUpState['tone']): string {
  switch (tone) {
    case 'overdue':
      return 'bg-red-100 text-red-700'
    case 'today':
      return 'bg-amber-100 text-amber-800'
    case 'tomorrow':
      return 'bg-violet-100 text-violet-700'
    case 'future':
      return 'bg-zinc-100 text-zinc-700'
    default:
      return 'text-zinc-300'
  }
}

// Convert ISO timestamp to a value the <input type="datetime-local"> accepts (YYYY-MM-DDTHH:MM).
export function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`
}

export function formatFollowUpDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}
