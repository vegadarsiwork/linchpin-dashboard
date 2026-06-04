import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/db/client'
import { requireSuperadminAPI } from '@/lib/admin/guard'

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  const guard = await requireSuperadminAPI()
  if (!guard.ok) return guard.res

  const body = (await req.json().catch(() => ({}))) as {
    body?: string
    note?: string
  }

  if (!body.body?.trim()) {
    return NextResponse.json({ error: 'body is required' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: script, error: fetchErr } = await admin
    .from('scripts')
    .select('id,org_id,title')
    .eq('id', id)
    .single()

  if (fetchErr || !script) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }

  const { data: latest } = await admin
    .from('script_versions')
    .select('version_number')
    .eq('script_id', id)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextVersion = ((latest?.version_number as number | null) ?? 0) + 1

  const { data: version, error } = await admin
    .from('script_versions')
    .insert({
      script_id: id,
      version_number: nextVersion,
      body: body.body.trim(),
      note: body.note?.trim() ?? null,
      created_by: guard.userId,
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update script body and status
  await admin
    .from('scripts')
    .update({ body: body.body.trim(), status: 'revised' })
    .eq('id', id)

  // Side-effects (best-effort)
  try {
    await admin.from('activities').insert({
      org_id: script.org_id,
      type: 'script_revised',
      title: `Script revised: ${script.title}`,
      description: body.note ?? null,
      link: `/dashboard/scripts/${id}`,
    })

    const { data: orgUsers } = await admin
      .from('users')
      .select('id')
      .eq('org_id', script.org_id)
      .eq('role', 'client')

    const rows = ((orgUsers ?? []) as { id: string }[]).map((u) => ({
      org_id: script.org_id,
      user_id: u.id,
      type: 'info',
      title: `Script updated: ${script.title}`,
      body: `Version ${nextVersion} is ready for review`,
      link: `/dashboard/scripts/${id}`,
      channels: ['in_app'],
    }))
    if (rows.length > 0) await admin.from('notifications').insert(rows)
  } catch {
    // swallow
  }

  return NextResponse.json({ data: version }, { status: 201 })
}
