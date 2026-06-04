import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { query } from '@/lib/db'
import type { Influencer } from '@/lib/types'
import { toPublicInfluencer } from '@/lib/influencers/public'

type PublicInfluencerRow = Influencer & { featured_reel_url: string | null }

function toNumber(value: string | null): number | null {
  if (!value) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const FEATURED_SELECT = `select i.*,
  (
    select coalesce(ir.gif_url, ir.video_url, ir.thumbnail_url)
    from influencer_reels ir
    where ir.influencer_id = i.id
      and ir.approval_status = 'approved'
    order by ir.is_featured desc, ir.created_at desc
    limit 1
  ) as featured_reel_url
from influencers i`

export async function GET(req: NextRequest) {
  try {
    const me = await getCurrentUser()
    if (!me) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })

    const { searchParams } = req.nextUrl
    const q = searchParams.get('q')?.trim().toLowerCase() ?? ''
    const platform = searchParams.get('platform')?.trim() ?? ''
    const city = searchParams.get('city')?.trim() ?? ''
    const language = searchParams.get('language')?.trim() ?? ''
    const niche = searchParams.get('niche')?.trim() ?? ''
    const budgetMax = toNumber(searchParams.get('budget_max'))

    // New filter params
    const gender = searchParams.get('gender')?.trim() ?? ''
    const minAge = toNumber(searchParams.get('min_age'))
    const maxAge = toNumber(searchParams.get('max_age'))
    const followerMin = toNumber(searchParams.get('follower_min'))
    const followerMax = toNumber(searchParams.get('follower_max'))
    const nichesParam = searchParams.get('niches')?.trim() ?? ''
    const languagesParam = searchParams.get('languages')?.trim() ?? ''
    const isAvailableParam = searchParams.get('is_available')?.trim() ?? ''

    const niches = nichesParam ? nichesParam.split(',').map((s) => s.trim()).filter(Boolean) : []
    const languages = languagesParam ? languagesParam.split(',').map((s) => s.trim()).filter(Boolean) : []
    const isAvailableFilter = isAvailableParam === 'true' ? true : isAvailableParam === 'false' ? false : null

    const values: unknown[] = []
    const clauses = [
      'i.active = true',
      'i.public_visible = true',
      "i.approval_status = 'approved'",
    ]

    if (q) {
      values.push(`%${q}%`)
      clauses.push(`(lower(coalesce(i.display_name, i.name)) like $${values.length} or lower(coalesce(i.city, '')) like $${values.length})`)
    }
    if (platform) {
      values.push(platform)
      clauses.push(`i.platform = $${values.length}`)
    }
    if (city) {
      values.push(city)
      clauses.push(`i.city = $${values.length}`)
    }
    if (language) {
      values.push(language)
      clauses.push(`$${values.length} = any(i.languages)`)
    }
    if (niche) {
      values.push(niche)
      clauses.push(`$${values.length} = any(i.niches)`)
    }
    if (budgetMax !== null) {
      values.push(budgetMax)
      clauses.push(`coalesce(i.price_range_min_inr, i.rate_per_reel, 0) <= $${values.length}`)
    }
    if (gender) {
      values.push(gender)
      clauses.push(`i.gender = $${values.length}`)
    }
    if (minAge !== null) {
      values.push(minAge)
      clauses.push(`extract(year from age(i.date_of_birth)) >= $${values.length}`)
    }
    if (maxAge !== null) {
      values.push(maxAge)
      clauses.push(`extract(year from age(i.date_of_birth)) <= $${values.length}`)
    }
    if (followerMin !== null) {
      values.push(followerMin)
      clauses.push(`i.follower_count >= $${values.length}`)
    }
    if (followerMax !== null) {
      values.push(followerMax)
      clauses.push(`i.follower_count <= $${values.length}`)
    }
    for (const n of niches) {
      values.push(n)
      clauses.push(`$${values.length} = any(i.niches)`)
    }
    for (const l of languages) {
      values.push(l)
      clauses.push(`$${values.length} = any(i.languages)`)
    }
    if (isAvailableFilter !== null) {
      values.push(isAvailableFilter)
      clauses.push(`i.is_available = $${values.length}`)
    }

    const rows = await query<PublicInfluencerRow>(
      `${FEATURED_SELECT}
      where ${clauses.join(' and ')}
      order by coalesce(i.average_reel_views, i.follower_count, 0) desc, coalesce(i.display_name, i.name) asc
      limit 60`,
      values
    )

    // Include featured section only when no content filters are applied
    const hasContentFilters = q || platform || city || language || niche || gender || niches.length > 0 || languages.length > 0
    let featured = undefined
    if (!hasContentFilters) {
      const featuredRows = await query<PublicInfluencerRow>(
        `${FEATURED_SELECT}
        where i.active = true and i.public_visible = true and i.approval_status = 'approved' and i.is_available = true
        order by coalesce(i.average_reel_views, 0) desc
        limit 6`,
        []
      )
      featured = featuredRows.map(toPublicInfluencer)
    }

    const result: Record<string, unknown> = { influencers: rows.map(toPublicInfluencer) }
    if (featured !== undefined) result.featured = featured
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load creators' },
      { status: 500 }
    )
  }
}
