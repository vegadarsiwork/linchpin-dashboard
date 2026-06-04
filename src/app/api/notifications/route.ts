import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/db/client'
import { getCurrentUser } from '@/lib/auth'

const PER_PAGE_DEFAULT = 20
const PER_PAGE_MAX = 100

export async function GET(req: NextRequest) {
  const me = await getCurrentUser()
  if (!me)
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
  if (!me.user.org_id) {
    return NextResponse.json({ error: 'NO_ORG' }, { status: 400 })
  }

  const sp = req.nextUrl.searchParams
  const page = Math.max(1, Number(sp.get('page')) || 1)
  const perPage = Math.min(
    PER_PAGE_MAX,
    Math.max(1, Number(sp.get('per_page')) || PER_PAGE_DEFAULT)
  )
  const filter = sp.get('filter')
  const type = sp.get('type')

  const supabase = createAdminClient()

  let query = supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('org_id', me.user.org_id)
    .order('created_at', { ascending: false })

  if (filter === 'unread') query = query.eq('is_read', false)
  if (type && type !== 'all') query = query.eq('type', type)

  const from = (page - 1) * perPage
  const to = from + perPage - 1

  const { data, count, error } = await query.range(from, to)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    notifications: data ?? [],
    page,
    per_page: perPage,
    total: count ?? 0,
  })
}
