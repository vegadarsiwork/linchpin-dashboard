import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import type { Influencer } from '@/lib/types'

export async function PATCH(req: NextRequest) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
  if (me.user.role !== 'influencer') return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

  let body: { id?: string; action?: 'available' | 'unavailable'; note?: string | null }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!body.id || !body.action) return NextResponse.json({ error: 'Request id and action are required.' }, { status: 400 })

  const influencer = await queryOne<Influencer>('select * from influencers where user_id = $1', [me.user.id])
  if (!influencer) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const status = body.action === 'available' ? 'under_review' : 'unavailable'
  const updated = await queryOne<{ id: string }>(
    `update influencer_match_requests
        set status = $1,
            declined_at = case when $1 = 'unavailable' then now() else declined_at end
      where id = $2
        and coalesce(requested_influencer_id, selected_influencer_id) = $3
      returning id`,
    [status, body.id, influencer.id]
  )
  if (!updated) return NextResponse.json({ error: 'Request not found' }, { status: 404 })

  await query(
    `insert into influencer_request_events (request_id, actor_user_id, event_type, note)
     values ($1, $2, $3, $4)`,
    [
      updated.id,
      me.user.id,
      body.action === 'available' ? 'influencer_marked_available' : 'influencer_declined',
      body.note?.slice(0, 1000) || null,
    ]
  )

  return NextResponse.json({ ok: true })
}
