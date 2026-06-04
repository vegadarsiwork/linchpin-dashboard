import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/db/client'
import { requireSuperadminAPI } from '@/lib/admin/guard'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireSuperadminAPI()
  if (!guard.ok) return guard.res

  const { id } = await params
  const admin = createAdminClient()

  const [infRes, campaignsRes, orgsRes] = await Promise.all([
    admin.from('influencers').select('*').eq('id', id).single(),
    admin
      .from('influencer_campaigns')
      .select('*, organisations(name)')
      .eq('influencer_id', id)
      .order('went_live_at', { ascending: false }),
    admin.from('organisations').select('id,name').order('name', { ascending: true }),
  ])

  if (infRes.error || !infRes.data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({
    influencer: infRes.data,
    campaigns: campaignsRes.data ?? [],
    orgs: orgsRes.data ?? [],
  })
}

const ALLOWED = new Set([
  'name', 'handle', 'platform', 'profile_url', 'avatar_url',
  'city', 'audience_regions', 'languages', 'niches', 'content_styles',
  'follower_count', 'engagement_rate', 'audience_notes',
  'rate_per_reel', 'rate_per_story', 'availability', 'linchpin_rating',
  'past_brand_categories', 'avoid_categories', 'competitor_brands',
  'notes', 'public_visible', 'public_bio', 'price_range_min_inr',
  'price_range_max_inr', 'sample_content_urls', 'average_reel_views',
  'audience_age_range', 'audience_gender_skew', 'active',
  'display_name', 'approval_status', 'public_profile_completed',
  'rejection_reason', 'public_visible',
])

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireSuperadminAPI()
  if (!guard.ok) return guard.res

  const { id } = await params
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const patch: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(body)) {
    if (ALLOWED.has(k)) patch[k] = v
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('influencers')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ influencer: data })
}
