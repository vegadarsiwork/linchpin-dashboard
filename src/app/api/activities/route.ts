import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/db/client'
import { getCurrentUser } from '@/lib/auth'

const MAX_LIMIT = 50

export async function GET(req: NextRequest) {
  const me = await getCurrentUser()
  if (!me) {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
  }

  const orgId = req.nextUrl.searchParams.get('org_id') ?? me.user.org_id
  if (!orgId) {
    return NextResponse.json({ error: 'NO_ORG' }, { status: 400 })
  }
  if (me.user.role !== 'superadmin' && orgId !== me.user.org_id) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  }

  const offset = Math.max(Number(req.nextUrl.searchParams.get('offset') ?? 0), 0)
  const limit = Math.min(
    Math.max(Number(req.nextUrl.searchParams.get('limit') ?? 20), 1),
    MAX_LIMIT
  )

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ activities: data ?? [] })
}
