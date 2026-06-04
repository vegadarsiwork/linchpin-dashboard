import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/db/client'
import { getCurrentUser } from '@/lib/auth'

// POST /api/reels/[id]/download-log — log a download event
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  const me = await getCurrentUser()
  if (!me)
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })

  const body = (await req.json().catch(() => ({}))) as { version_id?: string }

  const supabase = createAdminClient()

  const { data: item, error: fetchErr } = await supabase
    .from('content_items')
    .select('id, org_id')
    .eq('id', id)
    .single()

  if (fetchErr || !item)
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  if (me.user.role !== 'superadmin' && item.org_id !== me.user.org_id)
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

  await supabase.from('reel_download_events').insert({
    content_item_id: id,
    org_id: item.org_id,
    user_id: me.user.id,
    version_id: body.version_id ?? null,
    downloaded_at: new Date().toISOString(),
  })

  return NextResponse.json({ ok: true })
}
