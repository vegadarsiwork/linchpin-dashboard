import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import type { ClipApprovalElement } from '@/lib/types'

const ELEMENT_TYPES = [
  'background_location',
  'voice_audio',
  'influencer_presence',
] as const

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const orgId = me.user.org_id
  if (!orgId) return NextResponse.json({ error: 'No organisation' }, { status: 403 })

  const clip = await queryOne<{ id: string }>(
    'select id from clips where id = $1 and org_id = $2',
    [id, orgId]
  )
  if (!clip) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = (await req.json()) as {
    element_type?: string
    element_status?: 'approved' | 'flagged'
    element_comment?: string
    action?: 'approve' | 'request_changes'
    feedback?: string
  }

  if (body.action === 'approve') {
    const elements = await query<ClipApprovalElement>(
      'select * from clip_approval_elements where clip_id = $1',
      [id]
    )
    const allReviewed = ELEMENT_TYPES.every((t) =>
      elements.find((e) => e.element_type === t && e.status !== 'pending')
    )
    if (!allReviewed) {
      return NextResponse.json(
        { error: 'All three elements must be reviewed before approving' },
        { status: 400 }
      )
    }
    await query(
      `update clips set status = 'approved', updated_at = now() where id = $1`,
      [id]
    )
    return NextResponse.json({ ok: true })
  }

  if (body.action === 'request_changes') {
    await query(
      `update clips set status = 'changes_requested', admin_notes = $2, updated_at = now() where id = $1`,
      [id, body.feedback ?? null]
    )
    return NextResponse.json({ ok: true })
  }

  const { element_type, element_status, element_comment } = body
  if (!element_type || !element_status) {
    return NextResponse.json(
      { error: 'element_type and element_status required' },
      { status: 400 }
    )
  }
  if (!ELEMENT_TYPES.includes(element_type as (typeof ELEMENT_TYPES)[number])) {
    return NextResponse.json({ error: 'Invalid element_type' }, { status: 400 })
  }

  await query(
    `insert into clip_approval_elements
       (clip_id, element_type, status, comment, reviewed_by, reviewed_at)
     values ($1, $2, $3, $4, $5, now())
     on conflict (clip_id, element_type)
     do update set
       status      = excluded.status,
       comment     = excluded.comment,
       reviewed_by = excluded.reviewed_by,
       reviewed_at = excluded.reviewed_at,
       updated_at  = now()`,
    [id, element_type, element_status, element_comment ?? null, me.user.id]
  )

  // Recalculate clip status
  const updated = await query<ClipApprovalElement>(
    'select * from clip_approval_elements where clip_id = $1',
    [id]
  )
  const reviewedCount = updated.filter((e) => e.status !== 'pending').length
  const newStatus = reviewedCount === 0 ? 'pending' : 'partially_reviewed'
  await query(
    `update clips set status = $2, updated_at = now() where id = $1`,
    [id, newStatus]
  )

  return NextResponse.json({ ok: true })
}
