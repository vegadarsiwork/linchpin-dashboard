import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/db/client'
import { getCurrentUser } from '@/lib/auth'

// GET /api/reels?orgId=
export async function GET(req: NextRequest) {
  const me = await getCurrentUser()
  if (!me)
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })

  const url = new URL(req.url)
  const orgId = url.searchParams.get('orgId') ?? me.user.org_id
  if (!orgId)
    return NextResponse.json({ error: 'NO_ORG' }, { status: 400 })

  if (me.user.role !== 'superadmin' && orgId !== me.user.org_id)
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('content_items')
    .select('*')
    .eq('org_id', orgId)
    .eq('type', 'reel')
    .order('created_at', { ascending: false })

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: data ?? [] })
}
