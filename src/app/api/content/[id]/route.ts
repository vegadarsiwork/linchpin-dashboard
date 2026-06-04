import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/db/client'
import { getCurrentUser } from '@/lib/auth'

const ALLOWED_STATUSES = new Set([
  'draft',
  'pending_approval',
  'review',
  'scheduled',
  'published',
  'rejected',
  'approved',
  'correction_requested',
  'correction_submitted',
  'revised',
  'final_approved',
])

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  const me = await getCurrentUser()
  if (!me)
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })

  const body = (await req.json().catch(() => ({}))) as {
    status?: string
    client_feedback?: string
  }

  if (body.status && !ALLOWED_STATUSES.has(body.status)) {
    return NextResponse.json({ error: 'INVALID_STATUS' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: existing, error: fetchErr } = await supabase
    .from('content_items')
    .select('id, org_id, title')
    .eq('id', id)
    .single()
  if (fetchErr || !existing) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }
  if (
    me.user.role !== 'superadmin' &&
    existing.org_id !== me.user.org_id
  ) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.status !== undefined) update.status = body.status
  if (body.client_feedback !== undefined)
    update.client_feedback = body.client_feedback

  const { data: updated, error: updErr } = await supabase
    .from('content_items')
    .update(update)
    .eq('id', id)
    .select('*')
    .single()
  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 })
  }

  if (body.status === 'approved' || body.status === 'rejected') {
    await supabase.from('activities').insert({
      org_id: existing.org_id,
      type: body.status === 'approved' ? 'content_approved' : 'content_rejected',
      title:
        body.status === 'approved'
          ? `Approved: ${existing.title}`
          : `Changes requested: ${existing.title}`,
      description: body.client_feedback ?? null,
      link: '/dashboard/reels',
    })
  }

  return NextResponse.json({ data: updated })
}
