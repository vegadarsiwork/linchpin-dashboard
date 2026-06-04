import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createAdminClient } from '@/lib/db/client'
import { InfluencerProfileTabs } from '@/components/studio/influencers/InfluencerProfileTabs'
import type { Influencer, InfluencerCampaign } from '@/lib/types'

export const dynamic = 'force-dynamic'

interface OrgRow { id: string; name: string }

export default async function InfluencerProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ influencerId: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { influencerId } = await params
  const { tab } = await searchParams
  const admin = createAdminClient()

  const [infRes, campaignsRes, orgsRes] = await Promise.all([
    admin.from('influencers').select('*').eq('id', influencerId).single<Influencer>(),
    admin
      .from('influencer_campaigns')
      .select('*, organisations(name)')
      .eq('influencer_id', influencerId)
      .order('went_live_at', { ascending: false }),
    admin.from('organisations').select('id,name').order('name', { ascending: true }),
  ])

  if (infRes.error || !infRes.data) notFound()

  const influencer = infRes.data
  const campaigns = (campaignsRes.data ?? []) as (InfluencerCampaign & { organisations: { name: string } | null })[]
  const orgs = (orgsRes.data ?? []) as OrgRow[]

  return (
    <div className="mx-auto max-w-[1280px] space-y-6">
      <div>
        <Link
          href="/admin/influencers"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900"
        >
          <ChevronLeft className="h-4 w-4" /> Influencers
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">{influencer.name}</h1>
        {influencer.handle && (
          <p className="mt-0.5 text-sm text-zinc-500">@{influencer.handle} · {influencer.platform ?? ''}</p>
        )}
      </div>

      <InfluencerProfileTabs
        influencer={influencer}
        campaigns={campaigns}
        orgs={orgs}
        initialTab={tab}
      />
    </div>
  )
}
