import { createAdminClient } from '@/lib/db/client'
import { MetricCard, type MetricIconKey } from '@/components/studio/MetricCard'
import { formatINR, formatNumber, formatPercent } from '@/lib/utils/format'
import type { Metric } from '@/lib/types'

type Format = 'num' | 'inr' | 'pct'

type MetricSpec = {
  key: string
  label: string
  module?: string
  iconKey: MetricIconKey
  format: Format
}

const SPECS: MetricSpec[] = [
  { key: 'leads_this_week',          label: 'Leads this week',         iconKey: 'userPlus',       format: 'num' },
  { key: 'campaigns_active',         label: 'Active campaigns',        iconKey: 'megaphone',      format: 'num' },
  { key: 'whatsapp_conversations',   label: 'WhatsApp conversations',  iconKey: 'messageSquare',  format: 'num',  module: 'zap' },
  { key: 'reels_published',          label: 'Reels published',         iconKey: 'fileVideo',      format: 'num',  module: 'content' },
  { key: 'content_pending_approval', label: 'Pending approval',        iconKey: 'alertCircle',    format: 'num',  module: 'content' },
  { key: 'email_open_rate',          label: 'Email open rate',         iconKey: 'mail',           format: 'pct',  module: 'outreach' },
  { key: 'reel_total_views',         label: 'Reel total views',        iconKey: 'eye',            format: 'num',  module: 'content' },
]

function fmt(value: number | null | undefined, format: Format): string {
  if (value === null || value === undefined) return '0'
  if (format === 'pct') return formatPercent(value)
  if (format === 'inr') return formatINR(value, { compact: true })
  return formatNumber(value, { compact: true })
}

export async function MetricCardsRow({
  orgId,
  activeModules,
}: {
  orgId: string
  activeModules: string[]
}) {
  const supabase = createAdminClient()
  const { data: rows } = await supabase
    .from('metrics')
    .select('*')
    .eq('org_id', orgId)

  const map = new Map<string, Metric>(
    (rows ?? []).map((m: Metric) => [m.metric_key, m])
  )
  const visible = SPECS.filter(
    (s) => !s.module || activeModules.includes(s.module)
  )

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {visible.map((s) => {
        const m = map.get(s.key)
        return (
          <MetricCard
            key={s.key}
            label={s.label}
            value={fmt(m?.metric_value ?? 0, s.format)}
            change={m?.metric_change ?? undefined}
            iconKey={s.iconKey}
            period="month"
          />
        )
      })}
    </div>
  )
}

export function MetricCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <MetricCard key={i} label="" value="" isLoading />
      ))}
    </div>
  )
}
