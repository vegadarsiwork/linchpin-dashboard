import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/db/client'
import { requireSuperadminAPI } from '@/lib/admin/guard'

const FIELDS = new Set(['title', 'description', 'module', 'status', 'due_date'])

export async function GET(req: NextRequest) {
  const guard = await requireSuperadminAPI()
  if (!guard.ok) return guard.res

  const orgId = req.nextUrl.searchParams.get('org_id')
  if (!orgId) {
    return NextResponse.json({ error: 'org_id required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('deliverables')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ deliverables: data ?? [] })
}

export async function POST(req: NextRequest) {
  const guard = await requireSuperadminAPI()
  if (!guard.ok) return guard.res

  let body: Record<string, unknown> & { org_id?: string; title?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.org_id || !body.title) {
    return NextResponse.json({ error: 'org_id and title required' }, { status: 400 })
  }

  const insert: Record<string, unknown> = {
    org_id: body.org_id,
    title: String(body.title).trim(),
    description: body.description ? String(body.description).trim() : null,
    module: body.module ? String(body.module) : null,
    status: body.status ? String(body.status) : 'pending',
    due_date: body.due_date || null,
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('deliverables')
    .insert(insert)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ deliverable: data }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const guard = await requireSuperadminAPI()
  if (!guard.ok) return guard.res

  let body: Record<string, unknown> & { id?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const patch: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(body)) {
    if (FIELDS.has(k)) patch[k] = v
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'no valid fields' }, { status: 400 })
  }
  patch.updated_at = new Date().toISOString()

  const admin = createAdminClient()

  // Fetch current state to detect status transitions
  const { data: current } = await admin
    .from('deliverables')
    .select('org_id,title,status')
    .eq('id', body.id)
    .single<{ org_id: string; title: string; status: string }>()

  // If transitioning to delivered, set delivered_at
  if (patch.status === 'delivered' && current?.status !== 'delivered') {
    patch.delivered_at = new Date().toISOString()
  }

  const { data, error } = await admin
    .from('deliverables')
    .update(patch)
    .eq('id', body.id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Auto-create activity + notification on delivery
  if (current && patch.status === 'delivered' && current.status !== 'delivered') {
    await Promise.all([
      admin.from('activities').insert({
        org_id: current.org_id,
        type: 'deliverable_delivered',
        title: `Delivered: ${current.title}`,
        description: null,
        metadata: { deliverable_id: body.id },
      }),
      admin.from('notifications').insert({
        org_id: current.org_id,
        type: 'deliverable',
        title: 'New deliverable ready',
        body: current.title,
        link: `/dashboard/deliverables`,
        channels: ['in_app'],
      }),
    ])
  }

  return NextResponse.json({ deliverable: data })
}
