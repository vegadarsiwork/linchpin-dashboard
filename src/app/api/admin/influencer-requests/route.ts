import { NextResponse, type NextRequest } from 'next/server'
import { requireSuperadminAPI } from '@/lib/admin/guard'
import { query, queryOne } from '@/lib/db'

const STATUSES = new Set([
  'requested',
  'under_review',
  'confirmed',
  'unavailable',
  'script_ready',
  'in_production',
  'delivered',
])

export async function GET() {
  const guard = await requireSuperadminAPI()
  if (!guard.ok) return guard.res

  const rows = await query(
    `select imr.*,
      o.name as org_name,
      u.full_name as client_name,
      u.email as client_email,
      i.name as influencer_name,
      i.handle as influencer_handle,
      i.platform as influencer_platform,
      i.rate_per_reel as internal_rate_per_reel,
      i.price_range_min_inr,
      i.price_range_max_inr
    from influencer_match_requests imr
    left join organisations o on o.id = imr.org_id
    left join users u on u.id = imr.created_by
    left join influencers i on i.id = coalesce(imr.requested_influencer_id, imr.selected_influencer_id)
    order by imr.created_at desc
    limit 80`
  )

  return NextResponse.json({ requests: rows })
}

export async function PATCH(req: NextRequest) {
  const guard = await requireSuperadminAPI()
  if (!guard.ok) return guard.res

  let body: {
    id?: string
    status?: string
    admin_notes?: string | null
    requested_influencer_id?: string | null
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
  if (body.status && !STATUSES.has(body.status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const sets: string[] = []
  const values: unknown[] = []

  if (body.status) {
    values.push(body.status)
    sets.push(`status = $${values.length}`)
    if (body.status === 'confirmed') sets.push('confirmed_at = now()', 'declined_at = null')
    if (body.status === 'unavailable') sets.push('declined_at = now()', 'confirmed_at = null')
  }
  if (body.admin_notes !== undefined) {
    values.push(body.admin_notes?.slice(0, 1500) || null)
    sets.push(`admin_notes = $${values.length}`)
  }
  if (body.requested_influencer_id !== undefined) {
    values.push(body.requested_influencer_id)
    sets.push(`requested_influencer_id = $${values.length}`, `selected_influencer_id = $${values.length}`)
  }

  if (sets.length === 0) return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })

  values.push(body.id)
  const updated = await queryOne<{ id: string; org_id: string; status: string }>(
    `update influencer_match_requests set ${sets.join(', ')} where id = $${values.length} returning id, org_id, status`,
    values
  )

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await query(
    `insert into activities (org_id, type, title, description, link, metadata)
     values ($1, 'influencer_request_updated', 'Influencer request updated', $2, '/dashboard/influencers', $3)`,
    [
      updated.org_id,
      `Request status changed to ${updated.status.replaceAll('_', ' ')}.`,
      JSON.stringify({ request_id: updated.id, status: updated.status }),
    ]
  )

  await query(
    `insert into influencer_request_events (request_id, actor_user_id, event_type, note)
     values ($1, $2, 'admin_status_updated', $3)`,
    [updated.id, guard.userId, body.admin_notes?.slice(0, 1000) || `Status changed to ${updated.status}`]
  )

  return NextResponse.json({ ok: true })
}
