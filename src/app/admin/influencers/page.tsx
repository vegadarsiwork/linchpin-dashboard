import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createAdminClient } from '@/lib/db/client'
import { InfluencerRosterTable } from '@/components/studio/influencers/InfluencerRosterTable'
import type { Influencer } from '@/lib/types'
import type { InfluencerRow } from '@/components/studio/influencers/InfluencerRosterTable'

export const dynamic = 'force-dynamic'

export default async function InfluencersPage() {
  const admin = createAdminClient()

  const [infRes, campaignRes] = await Promise.all([
    admin.from('influencers').select('*').eq('active', true).order('name', { ascending: true }),
    admin.from('influencer_campaigns').select('influencer_id'),
  ])

  const raw = (infRes.data ?? []) as Influencer[]
  const campaigns = campaignRes.data ?? []

  const countMap = new Map<string, number>()
  for (const c of campaigns) {
    countMap.set(c.influencer_id, (countMap.get(c.influencer_id) ?? 0) + 1)
  }

  const influencers: InfluencerRow[] = raw.map((inf) => ({
    ...inf,
    campaign_count: countMap.get(inf.id) ?? 0,
  }))

  const totalActive = influencers.length
  const withEng = influencers.filter((i) => i.engagement_rate != null)
  const avgEngagement = withEng.length > 0
    ? withEng.reduce((s, i) => s + (i.engagement_rate ?? 0), 0) / withEng.length
    : 0
  const uniqueCities = new Set(influencers.map((i) => i.city).filter(Boolean)).size
  const totalCampaigns = campaigns.length

  const stats = [
    { label: 'Active Influencers', value: totalActive },
    { label: 'Avg Engagement', value: `${avgEngagement.toFixed(1)}%` },
    { label: 'Cities Covered', value: uniqueCities },
    { label: 'Campaigns Run', value: totalCampaigns },
  ]

  const allCities = [...new Set(influencers.map((i) => i.city).filter((c): c is string => !!c))].sort()
  const allNiches = [...new Set(influencers.flatMap((i) => i.niches))].sort()

  return (
    <div className="mx-auto max-w-[1280px] space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Influencers</h1>
          <p className="mt-0.5 text-sm text-zinc-500">{totalActive} active in roster</p>
        </div>
        <Link
          href="/admin/influencers/new"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#7C3AED] px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#6D28D9]"
        >
          <Plus className="h-4 w-4" /> Add Influencer
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-zinc-200 bg-white px-5 py-4">
            <div className="text-2xl font-semibold tabular-nums text-zinc-900">{s.value}</div>
            <div className="mt-0.5 text-[12px] text-zinc-500">{s.label}</div>
          </div>
        ))}
      </div>

      <InfluencerRosterTable influencers={influencers} allCities={allCities} allNiches={allNiches} />
    </div>
  )
}
