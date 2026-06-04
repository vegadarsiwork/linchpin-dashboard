import { NextResponse, type NextRequest } from 'next/server'
import { requireSuperadminAPI } from '@/lib/admin/guard'
import { queryOne, query } from '@/lib/db'
import { openRouterChat, parseJsonObject } from '@/lib/ai/openrouter'

type GeneratePayload = {
  org_id: string
  influencer_id?: string | null
  match_request_id?: string | null
  title?: string
  brief?: Record<string, unknown>
}

type ScriptResponse = {
  title: string
  variations: Array<{
    name: string
    hook: string
    beats: string[]
    shot_list: string[]
    caption_angle: string
    cta: string
    creator_notes: string
  }>
}

export async function POST(req: NextRequest) {
  const guard = await requireSuperadminAPI()
  if (!guard.ok) return guard.res

  let body: GeneratePayload
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.org_id) return NextResponse.json({ error: 'org_id is required' }, { status: 400 })

  const org = await queryOne(
    `select id, name, brand_category, brand_description, target_audience, brand_tone from organisations where id = $1`,
    [body.org_id]
  )
  if (!org) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const influencer = body.influencer_id
    ? await queryOne(
        `select id, name, handle, platform, city, languages, niches, content_styles, audience_notes, public_bio from influencers where id = $1`,
        [body.influencer_id]
      )
    : null

  const matchRequest = body.match_request_id
    ? await queryOne<{ brief: Record<string, unknown> }>(
        `select brief from influencer_match_requests where id = $1`,
        [body.match_request_id]
      )
    : null

  const brief = body.brief ?? matchRequest?.brief ?? {}
  const prompt = `Create creator-specific reel scripts for Linchpin Studio.

CLIENT:
${JSON.stringify(org, null, 2)}

CREATOR:
${JSON.stringify(influencer, null, 2)}

CAMPAIGN BRIEF:
${JSON.stringify(brief, null, 2)}

Return ONLY valid JSON:
{
  "title": "Short campaign script title",
  "variations": [
    {
      "name": "Variation name",
      "hook": "Opening hook",
      "beats": ["Beat 1", "Beat 2", "Beat 3"],
      "shot_list": ["Shot 1", "Shot 2", "Shot 3"],
      "caption_angle": "Caption direction",
      "cta": "Specific CTA",
      "creator_notes": "How this creator should deliver it"
    }
  ]
}

Generate exactly 3 variations. Keep it practical for Instagram reels and UGC ads.`

  let generated: ScriptResponse
  try {
    const raw = await openRouterChat({ messages: [{ role: 'user', content: prompt }], maxTokens: 4096 })
    generated = parseJsonObject<ScriptResponse>(raw)
  } catch {
    return NextResponse.json({ error: 'Script generation failed. Please try again.' }, { status: 422 })
  }

  const script = await queryOne<{ id: string }>(
    `insert into scripts (org_id, title, brief, variations, status, influencer_id, created_by)
     values ($1, $2, $3, $4, 'draft', $5, $6)
     returning id`,
    [
      body.org_id,
      body.title?.trim() || generated.title || 'Influencer reel script',
      JSON.stringify(brief),
      JSON.stringify(generated.variations ?? []),
      body.influencer_id || null,
      guard.userId,
    ]
  )

  if (body.match_request_id && script?.id) {
    await query(
      `update influencer_match_requests set status = 'script_ready' where id = $1`,
      [body.match_request_id]
    )
  }

  return NextResponse.json({ script_id: script?.id, script: generated })
}
