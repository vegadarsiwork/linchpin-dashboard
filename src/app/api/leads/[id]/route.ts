import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/db/client'
import { getCurrentUser } from '@/lib/auth'

const ALLOWED_LEAD_FIELDS = new Set([
  'name',
  'phone',
  'email',
  'source_detail',
  'status',
  'notes',
  'follow_up_at',
  'follow_up_note',
  'metadata',
])

const ALLOWED_STATUSES = new Set([
  'new',
  'contacted',
  'qualified',
  'converted',
  'lost',
])

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  const me = await getCurrentUser()
  if (!me)
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>

  if (
    typeof body.status === 'string' &&
    !ALLOWED_STATUSES.has(body.status)
  ) {
    return NextResponse.json({ error: 'INVALID_STATUS' }, { status: 400 })
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const k of Object.keys(body)) {
    if (ALLOWED_LEAD_FIELDS.has(k)) update[k] = body[k]
  }

  const supabase = createAdminClient()

  const { data: existing, error: fetchErr } = await supabase
    .from('leads')
    .select('id, org_id, name, status, follow_up_at')
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

  const { data: updated, error: updErr } = await supabase
    .from('leads')
    .update(update)
    .eq('id', id)
    .select('*')
    .single()
  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 })
  }

  // Status changes are significant — log activity
  if (
    typeof body.status === 'string' &&
    body.status !== existing.status
  ) {
    await supabase.from('activities').insert({
      org_id: existing.org_id,
      type: 'lead_status_changed',
      title: `Lead status: ${body.status}`,
      description: existing.name ?? null,
      link: '/dashboard/leads',
    })
  }

  return NextResponse.json({ data: updated })
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  const me = await getCurrentUser()
  if (!me)
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })

  const url = req.nextUrl
  const hard = url.searchParams.get('hard') === '1'

  const supabase = createAdminClient()

  const { data: existing, error: fetchErr } = await supabase
    .from('leads')
    .select('id, org_id, name')
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

  if (hard) {
    const { error: delErr } = await supabase.from('leads').delete().eq('id', id)
    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true, deleted: true })
  }

  const { data: updated, error: updErr } = await supabase
    .from('leads')
    .update({ status: 'lost', updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()
  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, data: updated })
}
