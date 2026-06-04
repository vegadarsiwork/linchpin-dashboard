import { createAdminClient } from '@/lib/db/client'
import { MetricCard } from '@/components/studio/MetricCard'

export async function ProductionSummaryCards({ orgId }: { orgId: string }) {
  const supabase = createAdminClient()

  const [activeCampaigns, pendingApprovals, completedReels, influencersShortlisted] =
    await Promise.all([
      supabase
        .from('campaigns')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('status', 'active'),
      supabase
        .from('content_items')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('status', 'pending_approval'),
      supabase
        .from('content_items')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('status', 'published'),
      supabase
        .from('influencer_match_requests')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .neq('status', 'declined'),
    ])

  const cards = [
    { label: 'Active Campaigns',      value: String(activeCampaigns.count ?? 0),       iconKey: 'megaphone'    },
    { label: 'Pending Approvals',     value: String(pendingApprovals.count ?? 0),       iconKey: 'clock'        },
    { label: 'Completed Reels',       value: String(completedReels.count ?? 0),         iconKey: 'checkCircle'  },
    { label: 'Influencers Shortlisted', value: String(influencersShortlisted.count ?? 0), iconKey: 'sparkles'  },
  ] as const

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {cards.map((c) => (
        <MetricCard key={c.label} label={c.label} value={c.value} iconKey={c.iconKey} />
      ))}
    </div>
  )
}

export function ProductionSummaryCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <MetricCard key={i} label="" value="" isLoading />
      ))}
    </div>
  )
}
