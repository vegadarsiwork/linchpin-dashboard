import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/db/client'
import { getCurrentUser } from '@/lib/auth'

// POST /api/reels/[id]/approve-final — client gives final approval
export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  const me = await getCurrentUser()
  if (!me)
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })

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

  const { data: updated, error: updErr } = await supabase
    .from('content_items')
    .update({ status: 'final_approved', updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()

  if (updErr)
    return NextResponse.json({ error: updErr.message }, { status: 500 })

  await supabase.from('activities').insert({
    org_id: item.org_id,
    type: 'reel_final_approved',
    title: `Final approved: ${item.title}`,
    description: null,
    link: '/dashboard/reels',
  })

  return NextResponse.json({ data: updated })
}
