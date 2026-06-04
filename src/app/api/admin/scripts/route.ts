import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/db/client'
import { requireSuperadminAPI } from '@/lib/admin/guard'

export async function POST(req: NextRequest) {
  const guard = await requireSuperadminAPI()
  if (!guard.ok) return guard.res

  const body = (await req.json().catch(() => ({}))) as {
    org_id?: string
    campaign_id?: string | null
    title?: string
    body?: string
  }

  if (!body.org_id || !body.title?.trim() || !body.body?.trim()) {
    return NextResponse.json(
      { error: 'org_id, title, and body are required' },
      { status: 400 }
    )
  }

  const admin = createAdminClient()

  const { data: script, error } = await admin
    .from('scripts')
    .insert({
      org_id: body.org_id,
      campaign_id: body.campaign_id ?? null,
      title: body.title.trim(),
      body: body.body.trim(),
      status: 'pending_review',
      created_by: guard.userId,
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const scriptId = script.id as string

  // Create initial version record
  await admin.from('script_versions').insert({
    script_id: scriptId,
    version_number: 1,
    body: body.body.trim(),
    note: 'Initial version',
    created_by: guard.userId,
  })

  // Activity + notifications (best-effort)
  try {
    await admin.from('activities').insert({
      org_id: body.org_id,
      type: 'script_uploaded',
      title: `New script: ${body.title.trim()}`,
      description: 'Waiting for your review',
      link: `/dashboard/scripts/${scriptId}`,
    })

    const { data: orgUsers } = await admin
      .from('users')
      .select('id,email')
      .eq('org_id', body.org_id)
      .eq('role', 'client')

    const contacts = (orgUsers ?? []) as { id: string; email: string }[]
    if (contacts.length > 0) {
      const rows = contacts.map((u) => ({
        org_id: body.org_id,
        user_id: u.id,
        type: 'info',
        title: 'New script ready for review',
        body: body.title!.trim(),
        link: `/dashboard/scripts/${scriptId}`,
        channels: ['in_app'],
      }))
      await admin.from('notifications').insert(rows)
    }
  } catch {
    // swallow side-effect errors
  }

  return NextResponse.json({ data: script }, { status: 201 })
}
