import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/db/client'
import { getCurrentUser } from '@/lib/auth'

// POST /api/reels/[id]/corrections — client submits correction note
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  const me = await getCurrentUser()
  if (!me)
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })

  const body = (await req.json().catch(() => ({}))) as { note?: string }
  const note = body.note?.trim()
  if (!note)
    return NextResponse.json({ error: 'note required' }, { status: 400 })

  const supabase = createAdminClient()

  const { data: item, error: fetchErr } = await supabase
    .from('content_items')
    .select('id, org_id, title')
    .eq('id', id)
    .single()

  if (fetchErr || !item)
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  if (me.user.role !== 'superadmin' && item.org_id !== me.user.org_id)
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

  // Resolve current version number
  const { data: latestVersions } = await supabase
    .from('content_item_versions')
    .select('version_number')
    .eq('content_item_id', id)
    .order('version_number', { ascending: false })
    .limit(1)

  const currentVersion = latestVersions?.[0]?.version_number ?? null

  await Promise.all([
    supabase.from('reel_corrections').insert({
      content_item_id: id,
      org_id: item.org_id,
      user_id: me.user.id,
      note,
      version_number: currentVersion,
    }),
    supabase
      .from('content_items')
      .update({
        status: 'correction_requested',
        client_feedback: note,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id),
    supabase.from('activities').insert({
      org_id: item.org_id,
      type: 'reel_correction_requested',
      title: `Correction requested: ${item.title}`,
      description: note,
      link: '/dashboard/reels',
    }),
  ])

  return NextResponse.json({ ok: true })
}
