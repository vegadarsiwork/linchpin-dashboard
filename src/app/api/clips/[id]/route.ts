import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { queryOne } from '@/lib/db'
import type { ClipWithRelations } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const orgId = me.user.org_id

  const clip = await queryOne<ClipWithRelations>(
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
     where c.id = $1
       and ($2::uuid is null or c.org_id = $2)
     group by c.id, camp.name`,
    [id, orgId]
  )

  if (!clip) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ clip })
}
