import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { queryOne } from '@/lib/db'
import type { Influencer } from '@/lib/types'

const ALLOWED = new Set([
  'display_name',
  'city',
  'avatar_url',
  'audience_regions',
  'languages',
  'niches',
  'content_styles',
  'follower_count',
  'engagement_rate',
  'public_bio',
  'price_range_min_inr',
  'price_range_max_inr',
  'average_reel_views',
  'audience_age_range',
  'audience_gender_skew',
  'availability',
  'handle',
  'gender',
  'state',
  'cover_photo_url',
  'collaboration_types',
  'is_available',
  'preferred_campaign_types',
  'past_collaborations',
  'platform_links',
  'platform_follower_counts',
  'date_of_birth',
])

export async function PATCH(req: NextRequest) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
  if (me.user.role !== 'influencer') return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const patch: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(body)) {
    if (ALLOWED.has(key)) patch[key] = value
  }

  const wantsSubmit = body.submit_for_review === true
  if (wantsSubmit) {
    patch.approval_status = 'pending_review'
    patch.profile_submitted_at = new Date().toISOString()
    patch.public_profile_completed = true
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const sets: string[] = []
  const values: unknown[] = []
  for (const [key, value] of Object.entries(patch)) {
    values.push(value)
    sets.push(`${key} = $${values.length}`)
  }
  values.push(me.user.id)

  const influencer = await queryOne<Influencer>(
    `update influencers
        set ${sets.join(', ')}
      where user_id = $${values.length}
      returning *`,
    values
  )

  if (!influencer) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  return NextResponse.json({ influencer })
}
