import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/db/client'
import { getCurrentUser } from '@/lib/auth'
import { query } from '@/lib/db'

const SCRIPT_STATUSES = new Set([
  'draft',
  'pending_review',
  'under_review',
  'changes_requested',
  'revised',
  'approved',
])

const CLIENT_ALLOWED_STATUSES = new Set(['approved', 'changes_requested'])

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })

  const supabase = createAdminClient()
  const { data: script, error } = await supabase
    .from('scripts')
    .select('*, campaigns(id,name)')
    .eq('id', id)
    .single()

  if (error || !script) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  if (me.user.role !== 'superadmin' && script.org_id !== me.user.org_id) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  }

  const admin = createAdminClient()
  const [versionsRes, commentsRes, timelineRows] = await Promise.all([
    admin
      .from('script_versions')
      .select('*')
      .eq('script_id', id)
      .order('version_number', { ascending: false }),
    admin
      .from('script_comments')
      .select('*')
      .eq('script_id', id)
      .order('created_at', { ascending: true }),
    query<{ id: string; type: string; title: string; description: string | null; created_at: string }>(
      `select id,type,title,description,created_at from activities
       where org_id = $1 and link like $2
       order by created_at asc limit 20`,
      [script.org_id, `%/scripts/${id}%`]
    ),
  ])

  return NextResponse.json({
    data: script,
    versions: versionsRes.data ?? [],
    comments: commentsRes.data ?? [],
    timeline: timelineRows,
  })
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })

  const body = (await req.json().catch(() => ({}))) as {
    status?: string
    feedback?: string
  }

  if (body.status && !SCRIPT_STATUSES.has(body.status)) {
    return NextResponse.json({ error: 'INVALID_STATUS' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data: existing, error: fetchErr } = await supabase
    .from('scripts')
    .select('id,org_id,title,status')
    .eq('id', id)
    .single()

  if (fetchErr || !existing) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  if (me.user.role !== 'superadmin' && existing.org_id !== me.user.org_id) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  }
  if (
    me.user.role === 'client' &&
    body.status &&
    !CLIENT_ALLOWED_STATUSES.has(body.status)
  ) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  }

  const update: Record<string, unknown> = {}
  if (body.status !== undefined) update.status = body.status

  const admin = createAdminClient()
  const { data: updated, error: updErr } = await admin
    .from('scripts')
    .update(update)
    .eq('id', id)
    .select('*')
    .single()

  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })

  try {
    const actType =
      body.status === 'approved'
        ? 'script_approved'
        : body.status === 'changes_requested'
          ? 'script_changes_requested'
          : 'script_updated'
    const actTitle =
      body.status === 'approved'
        ? `Script approved: ${existing.title}`
        : body.status === 'changes_requested'
          ? `Changes requested: ${existing.title}`
          : `Script updated: ${existing.title}`

    await admin.from('activities').insert({
      org_id: existing.org_id,
      type: actType,
      title: actTitle,
      description: body.feedback ?? null,
      link: `/dashboard/scripts/${id}`,
    })

    if (
      me.user.role === 'client' &&
      (body.status === 'approved' || body.status === 'changes_requested')
    ) {
      const { data: admins } = await admin
        .from('users')
        .select('id')
        .eq('role', 'superadmin')
      const rows = ((admins ?? []) as { id: string }[]).map((u) => ({
        org_id: existing.org_id,
        user_id: u.id,
        type: 'info',
        title: actTitle,
        body: body.feedback ?? null,
        link: `/admin/clients/${existing.org_id}/scripts`,
        channels: ['in_app'],
      }))
      if (rows.length > 0) await admin.from('notifications').insert(rows)
    }
  } catch {
    // swallow side-effect errors
  }

  return NextResponse.json({ data: updated })
}
