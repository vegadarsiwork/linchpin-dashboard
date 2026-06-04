import { createAdminClient } from '@/lib/db/client'
import { MatchClient } from '@/components/studio/match/MatchClient'
import type { OrgOption } from '@/components/studio/match/BriefForm'

export const dynamic = 'force-dynamic'

export default async function MatchPage() {
  const admin = createAdminClient()

  const [orgsRes, prevRes] = await Promise.all([
    admin
      .from('organisations')
      .select('id,name,brand_category,target_audience,brand_tone')
      .eq('status', 'active')
      .order('name', { ascending: true }),
    admin
      .from('influencer_match_requests')
      .select('id,created_at,brief,org_id,selected_influencer_id,organisations(name),influencers!selected_influencer_id(name,handle)')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const orgs = (orgsRes.data ?? []) as OrgOption[]
  const prevMatches = prevRes.data ?? []

  return (
    <div className="mx-auto max-w-[1280px] space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Match Creator</h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          Tag-based influencer matching - fill a brief, get your top 5.
        </p>
      </div>
      <MatchClient orgs={orgs} prevMatches={prevMatches} />
    </div>
  )
}
