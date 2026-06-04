import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/db/client'
import { requireSuperadminAPI } from '@/lib/admin/guard'

export async function GET() {
  const guard = await requireSuperadminAPI()
  if (!guard.ok) return guard.res

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('organisations')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ orgs: data ?? [] })
}

interface CreatePayload {
  org: Record<string, unknown> & { name: string; slug: string }
  monthly_rate?: number | null
  contact: { full_name: string; email: string; phone: string | null }
}

export async function POST(req: NextRequest) {
  const guard = await requireSuperadminAPI()
  if (!guard.ok) return guard.res

  let body: CreatePayload
  try {
    body = (await req.json()) as CreatePayload
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.org?.name?.trim() || !body.org?.slug?.trim()) {
    return NextResponse.json({ error: 'Name and slug required' }, { status: 400 })
  }
  if (!body.contact?.email?.trim() || !body.contact?.full_name?.trim()) {
    return NextResponse.json(
      { error: 'Contact name and email required' },
      { status: 400 }
    )
  }

  const admin = createAdminClient()

  // Insert organisation
  const { data: orgRow, error: orgErr } = await admin
    .from('organisations')
    .insert({ ...body.org })
    .select()
    .single()

  if (orgErr) {
    if (orgErr.message.toLowerCase().includes('duplicate')) {
      return NextResponse.json(
        { error: `Slug "${body.org.slug}" is already taken.` },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: orgErr.message }, { status: 500 })
  }

  const orgId = orgRow.id as string

  // Invite the auth user
  const origin = req.nextUrl.origin
  const { data: invite, error: inviteErr } =
    await admin.auth.admin.inviteUserByEmail(body.contact.email, {
      redirectTo: `${origin}/dashboard/set-password`,
      data: { full_name: body.contact.full_name, org_id: orgId },
    })

  if (inviteErr || !invite?.user) {
    // Rollback the org so we don't leave an orphan
    await admin.from('organisations').delete().eq('id', orgId)
    return NextResponse.json(
      { error: inviteErr?.message || 'Failed to invite user' },
      { status: 500 }
    )
  }

  // Insert users profile row
  const { error: userErr } = await admin.from('users').insert({
    id: invite.user.id,
    email: body.contact.email,
    full_name: body.contact.full_name,
    phone: body.contact.phone,
    role: 'client',
    org_id: orgId,
  })

  if (userErr) {
    // Best-effort rollback of auth user + org
    await admin.auth.admin.deleteUser(invite.user.id)
    await admin.from('organisations').delete().eq('id', orgId)
    return NextResponse.json({ error: userErr.message }, { status: 500 })
  }

  return NextResponse.json({ org_id: orgId, user_id: invite.user.id }, { status: 201 })
}
