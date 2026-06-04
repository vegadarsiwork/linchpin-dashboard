import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { query } from '@/lib/db'
import type { ClipWithRelations } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = me.user.org_id
  if (!orgId) return NextResponse.json({ error: 'No organisation' }, { status: 403 })

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
