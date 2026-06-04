import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { queryOne, query } from '@/lib/db'
import type { Clip, ClipWithRelations } from '@/lib/types'

export async function POST(req: Request) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (me.user.role !== 'superadmin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = (await req.json()) as {
    org_id: string
    title: string
    campaign_id?: string | null
    preview_url?: string | null
    full_quality_url?: string | null
    duration_seconds?: number | null
    admin_notes?: string | null
  }

  if (!body.org_id || !body.title?.trim()) {
    return NextResponse.json({ error: 'org_id and title required' }, { status: 400 })
  }

  const clip = await queryOne<Clip>(
    `insert into clips
       (org_id, campaign_id, title, preview_url, full_quality_url, duration_seconds, admin_notes)
     values ($1, $2, $3, $4, $5, $6, $7)
     returning *`,
    [
      body.org_id,
      body.campaign_id ?? null,
      body.title.trim(),
      body.preview_url ?? null,
      body.full_quality_url ?? null,
      body.duration_seconds ?? null,
      body.admin_notes ?? null,
    ]
  )

  return NextResponse.json({ clip }, { status: 201 })
}

export async function GET(req: Request) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (me.user.role !== 'superadmin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const orgId = searchParams.get('org_id')
  if (!orgId) return NextResponse.json({ error: 'org_id required' }, { status: 400 })

  const clips = await query<ClipWithRelations>(
    `select
       c.*,
       camp.name as campaign_name,
       coalesce(
         json_agg(e order by e.element_type) filter (where e.id is not null),
         '[]'::json
       ) as elements
     from clips c
     left join campaigns camp on camp.id = c.campaign_id
     left join clip_approval_elements e on e.clip_id = c.id
     where c.org_id = $1
     group by c.id, camp.name
     order by c.created_at desc`,
    [orgId]
  )

  return NextResponse.json({ clips })
}
