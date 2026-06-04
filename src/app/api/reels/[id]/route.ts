import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/db/client'
import { getCurrentUser } from '@/lib/auth'

// GET /api/reels/[id] — reel with versions + corrections
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  const me = await getCurrentUser()
  if (!me)
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })

  const supabase = createAdminClient()

  const { data: item, error: itemErr } = await supabase
    .from('content_items')
    .select('*')
    .eq('id', id)
    .single()

  if (itemErr || !item)
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  if (me.user.role !== 'superadmin' && item.org_id !== me.user.org_id)
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

  const [versionsRes, correctionsRes] = await Promise.all([
    supabase
      .from('content_item_versions')
      .select('*')
      .eq('content_item_id', id)
      .order('version_number', { ascending: false }),
    supabase
      .from('reel_corrections')
      .select('*')
      .eq('content_item_id', id)
      .order('created_at', { ascending: false }),
  ])

  return NextResponse.json({
    data: {
      ...item,
      versions: versionsRes.data ?? [],
      corrections: correctionsRes.data ?? [],
    },
  })
}
