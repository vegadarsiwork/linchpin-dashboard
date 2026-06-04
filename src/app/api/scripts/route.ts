import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/db/client'
import { getCurrentUser } from '@/lib/auth'

const SORT_COLS = new Set(['created_at', 'title', 'status'])

export async function GET(req: NextRequest) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
  if (!me.user.org_id) return NextResponse.json({ error: 'NO_ORG' }, { status: 403 })

  const url = req.nextUrl
  const requestedOrg = url.searchParams.get('orgId')
  const orgId =
    me.user.role === 'superadmin' && requestedOrg
      ? requestedOrg
      : me.user.org_id

  if (me.user.role !== 'superadmin' && orgId !== me.user.org_id) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  }

  const status = url.searchParams.get('status')
  const campaignId = url.searchParams.get('campaignId')
  const sortParam = url.searchParams.get('sort') ?? 'created_at'
  const sortCol = SORT_COLS.has(sortParam) ? sortParam : 'created_at'
  const ascending = url.searchParams.get('order') === 'asc'
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 100), 500)
  const offset = Math.max(Number(url.searchParams.get('offset') ?? 0), 0)

  const supabase = createAdminClient()
  let q = supabase
    .from('scripts')
    .select('id,org_id,campaign_id,title,body,status,created_at,updated_at,campaigns(id,name)', {
      count: 'exact',
    })
    .eq('org_id', orgId)
    .order(sortCol, { ascending })
    .range(offset, offset + limit - 1)

  if (status && status !== 'all') q = q.eq('status', status)
  if (campaignId && campaignId !== 'all') q = q.eq('campaign_id', campaignId)

  const { data, count, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: data ?? [], count: count ?? 0 })
}
