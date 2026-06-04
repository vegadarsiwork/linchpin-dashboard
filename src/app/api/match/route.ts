import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/db/client'
import { requireSuperadminAPI } from '@/lib/admin/guard'
import { rankInfluencersByTags } from '@/lib/influencers/tag-match'

interface Brief {
  org_id: string
  brand_category: string
  target_audience: string
  goal: string
  format: string
  language: string
  tone: string
  budget_min: number | null
  budget_max: number | null
  timeline: string
  notes: string
}

type InfluencerRow = {
  id: string
  name: string
  handle: string | null
  platform: string
  city: string | null
  audience_regions: unknown
  languages: unknown
  niches: unknown
  content_styles: unknown
  follower_count: number | null
  engagement_rate: number | null
  rate_per_reel: number | null
  availability: string | null
  linchpin_rating: number | null
  audience_notes: string | null
  past_brand_categories: unknown
  avoid_categories: unknown
}

type CampaignHistoryRow = {
  influencer_id: string
  team_rating: number | null
  client_rating: number | null
}

export async function POST(req: NextRequest) {
  const guard = await requireSuperadminAPI()
  if (!guard.ok) return guard.res

  let brief: Brief
  try {
    brief = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!brief.org_id) {
    return NextResponse.json({ error: 'Select a client first' }, { status: 400 })
  }

  const admin = createAdminClient()

  const [influencersRes, campaignsRes] = await Promise.all([
    admin.from('influencers').select('*').eq('active', true),
    admin
      .from('influencer_campaigns')
      .select('influencer_id,team_rating,client_rating'),
  ])

  if (influencersRes.error) {
    return NextResponse.json({ error: 'Failed to fetch roster' }, { status: 500 })
  }

  const influencers = (influencersRes.data ?? []) as InfluencerRow[]
  const campaigns = (campaignsRes.data ?? []) as CampaignHistoryRow[]

  const historyMap = new Map<string, CampaignHistoryRow[]>()
  for (const campaign of campaigns) {
    const list = historyMap.get(campaign.influencer_id) ?? []
    list.push(campaign)
    historyMap.set(campaign.influencer_id, list)
  }

  const campaignBoosts = new Map<string, number>()
  for (const [influencerId, rows] of historyMap) {
    const ratings = rows
      .map((row) => row.team_rating ?? row.client_rating ?? null)
      .filter((rating): rating is number => rating !== null)
    const boost =
      ratings.length > 0
        ? Math.min(8, ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length)
        : 0
    campaignBoosts.set(influencerId, boost)
  }

  const rankedMatches = rankInfluencersByTags(brief, influencers)
    .map((match) => ({
      ...match,
      score: Math.min(100, Math.round(match.score + (campaignBoosts.get(match.influencer_id) ?? 0))),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  const enriched = rankedMatches.map((match) => ({
    influencer_id: match.influencer_id,
    score: match.score,
    reasoning: match.reasoning,
    flags: match.flags,
    influencer: match.influencer,
  }))
  const storedMatches = rankedMatches.map((match) => ({
    influencer_id: match.influencer_id,
    score: match.score,
    reasoning: match.reasoning,
    flags: match.flags,
    matched_tags: match.matched_tags,
  }))

  const { data: matchReq } = await admin
    .from('influencer_match_requests')
    .insert({ org_id: brief.org_id, brief, matches: storedMatches, selected_influencer_id: null })
    .select('id')
    .single()

  return NextResponse.json({ matches: enriched, match_request_id: matchReq?.id ?? null })
}
