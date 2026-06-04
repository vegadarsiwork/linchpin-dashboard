import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/db/client'
import { getCurrentUser } from '@/lib/auth'

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  const me = await getCurrentUser()
  if (!me)
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })

  const body = (await req.json().catch(() => ({}))) as { is_read?: boolean }

  const supabase = createAdminClient()

  const { data: existing, error: fetchErr } = await supabase
    .from('notifications')
    .select('id, org_id')
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

  const update: Record<string, unknown> = {}
  if (body.is_read !== undefined) update.is_read = !!body.is_read

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('notifications')
    .update(update)
    .eq('id', id)
    .select('*')
    .single()
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ notification: data })
}
