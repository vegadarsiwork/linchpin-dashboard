import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { toPublicInfluencer } from '@/lib/influencers/public'
import { rankInfluencersByTags } from '@/lib/influencers/tag-match'
import type { Influencer, PublicInfluencerMatch } from '@/lib/types'

type Brief = {
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

function cleanBrief(input: Partial<Brief>): Brief {
  return {
    brand_category: String(input.brand_category ?? '').slice(0, 120),
    target_audience: String(input.target_audience ?? '').slice(0, 500),
    goal: String(input.goal ?? '').slice(0, 80),
    format: String(input.format ?? '').slice(0, 80),
    language: String(input.language ?? '').slice(0, 80),
    tone: String(input.tone ?? '').slice(0, 80),
    budget_min: typeof input.budget_min === 'number' ? input.budget_min : null,
    budget_max: typeof input.budget_max === 'number' ? input.budget_max : null,
    timeline: String(input.timeline ?? '').slice(0, 160),
    notes: String(input.notes ?? '').slice(0, 1000),
  }
}

export async function POST(req: NextRequest) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
  if (!me.user.org_id || !me.org) {
    return NextResponse.json({ error: 'Account is not linked to an organisation' }, { status: 403 })
  }

  let brief: Brief
  try {
    brief = cleanBrief(await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!brief.brand_category || !brief.target_audience || !brief.goal) {
    return NextResponse.json({ error: 'Brand category, audience, and goal are required' }, { status: 400 })
  }

  const influencers = await query<Influencer>(
    `select * from influencers
      where active = true and public_visible = true and approval_status = 'approved'
      order by coalesce(average_reel_views, follower_count, 0) desc, coalesce(display_name, name) asc
      limit 80`
  )

  if (influencers.length === 0) {
    return NextResponse.json({ error: 'No public creators are available yet' }, { status: 404 })
  }

  const rankedMatches = rankInfluencersByTags(brief, influencers).slice(0, 5)
  const storedMatches = rankedMatches.map((match) => ({
    influencer_id: match.influencer_id,
    score: match.score,
    reasoning: match.reasoning,
    flags: match.flags,
    matched_tags: match.matched_tags,
  }))
  const matches: PublicInfluencerMatch[] = rankedMatches
    .map((match) => ({
      influencer_id: match.influencer_id,
      score: match.score,
      reasoning: match.reasoning,
      flags: match.flags,
      influencer: toPublicInfluencer(match.influencer),
    }))

  const created = await queryOne<{ id: string }>(
    `insert into influencer_match_requests
      (org_id, brief, matches, created_by, status, request_source)
      values ($1, $2, $3, $4, 'under_review', 'match')
      returning id`,
    [me.user.org_id, JSON.stringify(brief), JSON.stringify(storedMatches), me.user.id]
  )

  return NextResponse.json({ matches, match_request_id: created?.id ?? null })
}
