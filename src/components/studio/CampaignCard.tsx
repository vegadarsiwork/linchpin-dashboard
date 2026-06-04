import { cn } from '@/lib/utils'
import { CAMPAIGN_STATUS_DOT, getCampaignTypeLabel } from '@/lib/constants'
import { formatINR, formatNumber, formatPercent } from '@/lib/utils/format'
import type { Campaign } from '@/lib/types'

export type CampaignCardProps = {
  campaign: Campaign
}

type Stat = { label: string; value: string }

function statsFor(campaign: Campaign): Stat[] {
  const s = (campaign.stats ?? {}) as Record<string, number | undefined>

  switch (campaign.type) {
    case 'cold_email':
      return [
        { label: 'Open rate',  value: formatPercent(s.open_rate) },
        { label: 'Reply rate', value: formatPercent(s.reply_rate) },
        { label: 'Meetings',   value: formatNumber(s.meetings_booked) },
      ]
    case 'linkedin':
      return [
        { label: 'Sent',        value: formatNumber(s.connections_sent) },
        { label: 'Accept rate', value: formatPercent(s.accept_rate) },
        { label: 'Reply rate',  value: formatPercent(s.reply_rate) },
      ]
    case 'meta_ads':
      return [
        { label: 'Spend', value: formatINR(s.spend, { compact: true }) },
        { label: 'Leads', value: formatNumber(s.leads) },
        { label: 'ROAS',  value: s.roas !== undefined ? `${s.roas.toFixed(1)}x` : '—' },
      ]
    case 'influencer_reel':
      return [
        { label: 'Views', value: formatNumber(s.views, { compact: true }) },
        { label: 'Saves', value: formatNumber(s.saves) },
        { label: 'Leads', value: formatNumber(s.leads) },
      ]
    case 'whatsapp_broadcast':
      return [
        { label: 'Sent',      value: formatNumber(s.sent) },
        { label: 'Read rate', value: formatPercent(s.read_rate) },
        { label: 'Replies',   value: formatNumber(s.replies) },
      ]
    default:
      return []
  }
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const stats = statsFor(campaign)
  const dotColor = CAMPAIGN_STATUS_DOT[campaign.status] ?? 'bg-zinc-400'
  const typeLabel = getCampaignTypeLabel(campaign.type)

  return (
    <div className="app-panel w-[280px] shrink-0 rounded-lg p-4 transition-colors hover:border-violet-200">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <p className="app-heading truncate text-sm font-semibold">
            {campaign.name}
          </p>
          <span className="app-soft-panel mt-1 inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium">
            {typeLabel}
          </span>
        </div>
        <span
          aria-label={`status ${campaign.status}`}
          className={cn('mt-1 h-2 w-2 shrink-0 rounded-full', dotColor)}
        />
      </div>

      {stats.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 border-t border-zinc-100 pt-3">
          {stats.map((s) => (
            <div key={s.label} className="min-w-0">
              <p className="app-subtle truncate text-[10px] uppercase tracking-wide">
                {s.label}
              </p>
              <p className="app-heading mt-0.5 truncate text-sm font-semibold tabular-nums">
                {s.value}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="app-muted border-t border-zinc-100 pt-3 text-xs">
          No stats yet
        </p>
      )}
    </div>
  )
}
