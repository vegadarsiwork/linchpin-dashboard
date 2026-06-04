import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/db/client'
import { requireSuperadminAPI } from '@/lib/admin/guard'

interface LogPayload {
  influencer_id: string
  org_id?: string | null
  brand_category?: string | null
  campaign_goal?: string | null
  content_style_used?: string | null
  platform?: string | null
  views?: number
  likes?: number
  comments?: number
  shares?: number
  saves?: number
  reach?: number
  leads_generated?: number
  engagement_rate?: number | null
  team_rating?: number | null
  client_rating?: number | null
  notes?: string | null
  went_live_at?: string | null
  script_id?: string | null
}

export async function POST(req: NextRequest) {
  const guard = await requireSuperadminAPI()
  if (!guard.ok) return guard.res

  let body: LogPayload
  try {
    body = (await req.json()) as LogPayload
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.influencer_id) {
    return NextResponse.json({ error: 'influencer_id required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('influencer_campaigns')
    .insert({
      influencer_id: body.influencer_id,
      org_id: body.org_id ?? null,
      brand_category: body.brand_category ?? null,
      campaign_goal: body.campaign_goal ?? null,
      content_style_used: body.content_style_used ?? null,
      platform: body.platform ?? null,
      views: body.views ?? 0,
      likes: body.likes ?? 0,
      comments: body.comments ?? 0,
      shares: body.shares ?? 0,
      saves: body.saves ?? 0,
      reach: body.reach ?? 0,
      leads_generated: body.leads_generated ?? 0,
      engagement_rate: body.engagement_rate ?? null,
      team_rating: body.team_rating ?? null,
      client_rating: body.client_rating ?? null,
      notes: body.notes ?? null,
      went_live_at: body.went_live_at ?? null,
      script_id: body.script_id ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ campaign: data }, { status: 201 })
}
