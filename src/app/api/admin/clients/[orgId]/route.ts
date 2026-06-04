import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/db/client'
import { requireSuperadminAPI } from '@/lib/admin/guard'

const ORG_FIELDS = new Set([
  'name',
  'slug',
  'logo_url',
  'plan',
  'status',
  'active_modules',
  'zap_enabled',
  'zap_org_id',
  'web_enabled',
  'account_manager_name',
  'account_manager_email',
  'account_manager_phone',
  'account_manager_avatar_url',
  'billing_cycle_start',
  'brand_category',
  'brand_description',
  'target_audience',
  'brand_tone',
])

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const guard = await requireSuperadminAPI()
  if (!guard.ok) return guard.res

  const { orgId } = await params
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('organisations')
    .select('*')
    .eq('id', orgId)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json({ org: data })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const guard = await requireSuperadminAPI()
  if (!guard.ok) return guard.res

  const { orgId } = await params
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const patch: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(body)) {
    if (ORG_FIELDS.has(k)) patch[k] = v
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }
  patch.updated_at = new Date().toISOString()

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('organisations')
    .update(patch)
    .eq('id', orgId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ org: data })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const guard = await requireSuperadminAPI()
  if (!guard.ok) return guard.res

  const { orgId } = await params
  const admin = createAdminClient()

  // Find associated client users to delete from auth.users
  const { data: users } = await admin
    .from('users')
    .select('id')
    .eq('org_id', orgId)
    .eq('role', 'client')

  for (const u of users ?? []) {
    await admin.auth.admin.deleteUser(u.id)
  }

  const { error } = await admin.from('organisations').delete().eq('id', orgId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
