import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/db/client'
import { getCurrentUser } from '@/lib/auth'

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
  if (!me.user.org_id) return NextResponse.json({ error: 'NO_ORG' }, { status: 403 })

  const body = (await req.json().catch(() => ({}))) as {
    comment?: string
    paragraph_index?: number
    selected_text?: string
  }

  if (!body.comment?.trim()) {
    return NextResponse.json({ error: 'comment is required' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data: script, error: fetchErr } = await supabase
    .from('scripts')
    .select('id,org_id,title')
    .eq('id', id)
    .single()

  if (fetchErr || !script) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  if (me.user.role !== 'superadmin' && script.org_id !== me.user.org_id) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { data: comment, error } = await admin
    .from('script_comments')
    .insert({
      script_id: id,
      user_id: me.user.id,
      paragraph_index: body.paragraph_index ?? null,
      selected_text: body.selected_text?.trim() ?? null,
      comment: body.comment.trim(),
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: comment }, { status: 201 })
}
