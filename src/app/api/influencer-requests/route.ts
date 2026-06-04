import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import type { Influencer, InfluencerMatchRequest } from '@/lib/types'
import { toPublicInfluencer } from '@/lib/influencers/public'

type RequestRow = InfluencerMatchRequest & {
  influencer_name: string | null
  influencer_platform: string | null
  influencer_avatar_url: string | null
  influencer_city: string | null
}

export async function GET() {
  try {
    const me = await getCurrentUser()
    if (!me) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
    if (!me.user.org_id) return NextResponse.json({ requests: [] })

    const rows = await query<RequestRow>(
      `select imr.*,
        coalesce(i.display_name, i.name) as influencer_name,
        i.platform as influencer_platform,
        i.avatar_url as influencer_avatar_url,
        i.city as influencer_city
      from influencer_match_requests imr
      left join influencers i on i.id = coalesce(imr.requested_influencer_id, imr.selected_influencer_id)
      where imr.org_id = $1
      order by imr.created_at desc
      limit 30`,
      [me.user.org_id]
    )

    return NextResponse.json({ requests: rows })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load requests' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const me = await getCurrentUser()
    if (!me) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
    if (!me.user.org_id || !me.org) {
      return NextResponse.json({ error: 'Account is not linked to an organisation' }, { status: 403 })
    }

    let body: {
      influencer_id?: string
      match_request_id?: string | null
      client_notes?: string | null
      request_source?: string
      brief?: Record<string, unknown>
      campaign_name?: string | null
      campaign_start_date?: string | null
      campaign_end_date?: string | null
      deliverables?: string | null
      budget_range?: string | null
      requirements_notes?: string | null
    }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    if (!body.influencer_id) {
      return NextResponse.json({ error: 'influencer_id is required' }, { status: 400 })
    }

    const influencer = await queryOne<Influencer>(
      `select * from influencers where id = $1 and active = true and public_visible = true and approval_status = 'approved'`,
      [body.influencer_id]
    )
    if (!influencer) {
      return NextResponse.json({ error: 'Creator not available' }, { status: 404 })
    }

    if (body.match_request_id) {
      const existing = await queryOne<{ id: string }>(
        `select id from influencer_match_requests where id = $1 and org_id = $2`,
        [body.match_request_id, me.user.org_id]
      )
      if (!existing) return NextResponse.json({ error: 'Match request not found' }, { status: 404 })

      const updated = await queryOne<{ id: string }>(
        `update influencer_match_requests
         set requested_influencer_id = $1,
             selected_influencer_id = $1,
             status = 'requested',
             request_source = $2,
             client_notes = $3,
             campaign_name = $6,
             campaign_start_date = $7,
             campaign_end_date = $8,
             deliverables = $9,
             budget_range = $10,
             requirements_notes = $11
         where id = $4 and org_id = $5
         returning id`,
        [
          body.influencer_id,
          body.request_source || 'match',
          body.client_notes?.slice(0, 1000) || null,
          body.match_request_id,
          me.user.org_id,
          body.campaign_name ?? null,
          body.campaign_start_date ?? null,
          body.campaign_end_date ?? null,
          body.deliverables ?? null,
          body.budget_range ?? null,
          body.requirements_notes ?? null,
        ]
      )
      if (updated?.id) {
        await query(
          `insert into influencer_request_events (request_id, actor_user_id, event_type, note)
           values ($1, $2, 'client_requested_creator', $3)`,
          [updated.id, me.user.id, body.client_notes?.slice(0, 1000) || null]
        )
      }
      return NextResponse.json({ request_id: updated?.id })
    }

    const created = await queryOne<{ id: string }>(
      `insert into influencer_match_requests
        (org_id, brief, matches, requested_influencer_id, selected_influencer_id, created_by, status, request_source, client_notes,
         campaign_name, campaign_start_date, campaign_end_date, deliverables, budget_range, requirements_notes)
        values ($1, $2, '[]'::jsonb, $3, $3, $4, 'requested', $5, $6, $7, $8, $9, $10, $11, $12)
        returning id`,
      [
        me.user.org_id,
        JSON.stringify(body.brief ?? {}),
        body.influencer_id,
        me.user.id,
        body.request_source || 'browse',
        body.client_notes?.slice(0, 1000) || null,
        body.campaign_name ?? null,
        body.campaign_start_date ?? null,
        body.campaign_end_date ?? null,
        body.deliverables ?? null,
        body.budget_range ?? null,
        body.requirements_notes ?? null,
      ]
    )

    await query(
      `insert into activities (org_id, type, title, description, link, metadata)
       values ($1, 'influencer_requested', 'Creator requested', $2, '/dashboard/influencers', $3)`,
      [
        me.user.org_id,
        `Requested ${toPublicInfluencer(influencer).name} for an influencer campaign.`,
        JSON.stringify({ influencer_id: body.influencer_id, request_id: created?.id }),
      ]
    )

    if (created?.id) {
      await query(
        `insert into influencer_request_events (request_id, actor_user_id, event_type, note)
         values ($1, $2, 'client_requested_creator', $3)`,
        [created.id, me.user.id, body.client_notes?.slice(0, 1000) || null]
      )
    }

    return NextResponse.json({ request_id: created?.id }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/influencer-requests]', error)
    return NextResponse.json({ error: 'Could not submit enquiry. Please try again.' }, { status: 500 })
  }
}
