import { NextResponse, type NextRequest } from 'next/server'
import { requireSuperadminAPI } from '@/lib/admin/guard'
import { query, queryOne } from '@/lib/db'

const PROFILE_STATUSES = new Set(['draft', 'pending_review', 'approved', 'rejected', 'suspended'])
const REEL_STATUSES = new Set(['pending_review', 'approved', 'rejected'])

export async function GET() {
  const guard = await requireSuperadminAPI()
  if (!guard.ok) return guard.res

  const [profiles, reels] = await Promise.all([
    query(
      `select i.*, u.email as owner_email, u.phone as owner_phone
       from influencers i
       left join users u on u.id = i.user_id
       where i.user_id is not null
         and i.approval_status in ('pending_review', 'draft')
       order by
         case i.approval_status when 'pending_review' then 0 when 'draft' then 1 else 2 end,
         i.created_at desc
       limit 80`
    ),
    query(
      `select ir.*, i.display_name, i.name, i.slug
       from influencer_reels ir
       join influencers i on i.id = ir.influencer_id
       where ir.approval_status = 'pending_review'
       order by ir.created_at desc
       limit 120`
    ),
  ])

  return NextResponse.json({ profiles, reels })
}

export async function PATCH(req: NextRequest) {
  const guard = await requireSuperadminAPI()
  if (!guard.ok) return guard.res

  let body: {
    type?: 'profile' | 'reel'
    id?: string
    status?: string
    rejection_reason?: string | null
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!body.type || !body.id || !body.status) {
    return NextResponse.json({ error: 'type, id and status are required' }, { status: 400 })
  }

  if (body.type === 'profile') {
    if (!PROFILE_STATUSES.has(body.status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    const row = await queryOne(
      `update influencers
          set approval_status = $1,
              public_visible = case when $1 = 'approved' then true else false end,
              approved_at = case when $1 = 'approved' then now() else approved_at end,
              rejected_at = case when $1 = 'rejected' then now() else null end,
              rejection_reason = $2
        where id = $3
        returning id`,
      [body.status, body.rejection_reason?.slice(0, 1000) || null, body.id]
    )
    if (!row) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  }

  if (!REEL_STATUSES.has(body.status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  const row = await queryOne(
    `update influencer_reels set approval_status = $1 where id = $2 returning id`,
    [body.status, body.id]
  )
  if (!row) return NextResponse.json({ error: 'Reel not found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
