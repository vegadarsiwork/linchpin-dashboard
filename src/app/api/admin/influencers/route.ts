import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/db/client'
import { requireSuperadminAPI } from '@/lib/admin/guard'
import type { Influencer } from '@/lib/types'

type InfluencerWithCampaignCount = Influencer & { campaign_count: number }
type CampaignRef = { influencer_id: string }

export async function GET(req: NextRequest) {
  const guard = await requireSuperadminAPI()
  if (!guard.ok) return guard.res

  const { searchParams } = req.nextUrl
  const q = (searchParams.get('q') ?? '').trim().toLowerCase()
  const platform = searchParams.get('platform') ?? ''
  const city = searchParams.get('city') ?? ''
  const availability = searchParams.get('availability') ?? ''
  const rating = searchParams.get('rating') ?? ''
  const niches = searchParams.getAll('niche')

  const admin = createAdminClient()
  const [infRes, campaignRes] = await Promise.all([
    admin.from('influencers').select('*').eq('active', true).order('name', { ascending: true }),
    admin.from('influencer_campaigns').select('influencer_id'),
  ])

  if (infRes.error) return NextResponse.json({ error: infRes.error.message }, { status: 500 })

  const countMap = new Map<string, number>()
  for (const c of (campaignRes.data ?? []) as CampaignRef[]) {
    countMap.set(c.influencer_id, (countMap.get(c.influencer_id) ?? 0) + 1)
  }

  let results: InfluencerWithCampaignCount[] = ((infRes.data ?? []) as Influencer[]).map((inf) => ({
    ...inf,
    campaign_count: countMap.get(inf.id) ?? 0,
  }))

  if (q) results = results.filter((r) => r.name?.toLowerCase().includes(q) || r.handle?.toLowerCase().includes(q))
  if (platform) results = results.filter((r) => (r.platform ?? '').toLowerCase() === platform.toLowerCase())
  if (city) results = results.filter((r) => r.city === city)
  if (availability) results = results.filter((r) => r.availability === availability)
  if (rating) results = results.filter((r) => (r.linchpin_rating ?? 0) >= parseInt(rating))
  if (niches.length > 0) results = results.filter((r) => niches.some((n) => (r.niches as string[]).includes(n)))

  return NextResponse.json({ influencers: results })
}

interface InfluencerPayload {
  name: string
  handle?: string | null
  platform?: string | null
  profile_url?: string | null
  avatar_url?: string | null
  city?: string | null
  audience_regions?: string[]
  languages?: string[]
  niches?: string[]
  content_styles?: string[]
  follower_count?: number | null
  engagement_rate?: number | null
  audience_notes?: string | null
  rate_per_reel?: number | null
  rate_per_story?: number | null
  availability?: string | null
  linchpin_rating?: number | null
  past_brand_categories?: string[]
  avoid_categories?: string[]
  competitor_brands?: string[]
  notes?: string | null
  public_visible?: boolean
  public_bio?: string | null
  price_range_min_inr?: number | null
  price_range_max_inr?: number | null
  sample_content_urls?: string[]
  average_reel_views?: number | null
  audience_age_range?: string | null
  audience_gender_skew?: string | null
  display_name?: string | null
  approval_status?: string
}

export async function POST(req: NextRequest) {
  const guard = await requireSuperadminAPI()
  if (!guard.ok) return guard.res

  let body: InfluencerPayload
  try {
    body = (await req.json()) as InfluencerPayload
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('influencers')
    .insert({
      name: body.name.trim(),
      display_name: body.display_name?.trim() || body.name.trim(),
      handle: body.handle?.trim() || null,
      platform: body.platform || null,
      profile_url: body.profile_url || null,
      avatar_url: body.avatar_url || null,
      city: body.city || null,
      audience_regions: body.audience_regions ?? [],
      languages: body.languages ?? [],
      niches: body.niches ?? [],
      content_styles: body.content_styles ?? [],
      follower_count: body.follower_count ?? null,
      engagement_rate: body.engagement_rate ?? null,
      audience_notes: body.audience_notes || null,
      rate_per_reel: body.rate_per_reel ?? null,
      rate_per_story: body.rate_per_story ?? null,
      availability: body.availability || 'active',
      linchpin_rating: body.linchpin_rating ?? null,
      past_brand_categories: body.past_brand_categories ?? [],
      avoid_categories: body.avoid_categories ?? [],
      competitor_brands: body.competitor_brands ?? [],
      notes: body.notes || null,
      public_visible: body.public_visible ?? false,
      public_bio: body.public_bio || null,
      price_range_min_inr: body.price_range_min_inr ?? null,
      price_range_max_inr: body.price_range_max_inr ?? null,
      sample_content_urls: body.sample_content_urls ?? [],
      average_reel_views: body.average_reel_views ?? null,
      audience_age_range: body.audience_age_range || null,
      audience_gender_skew: body.audience_gender_skew || null,
      approval_status: body.approval_status || 'approved',
      approved_at: body.approval_status === 'approved' || !body.approval_status ? new Date().toISOString() : null,
      public_profile_completed: true,
      active: true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ influencer: data }, { status: 201 })
}
