import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/db/client'
import { getCurrentUser } from '@/lib/auth'

// GET /api/reels/[id]/versions — list versions
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  const me = await getCurrentUser()
  if (!me)
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })

  const supabase = createAdminClient()

  const { data: item, error: fetchErr } = await supabase
    .from('content_items')
    .select('id, org_id')
    .eq('id', id)
    .single()

  if (fetchErr || !item)
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  if (me.user.role !== 'superadmin' && item.org_id !== me.user.org_id)
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

  const { data: versions } = await supabase
    .from('content_item_versions')
    .select('*')
    .eq('content_item_id', id)
    .order('version_number', { ascending: false })

  return NextResponse.json({ data: versions ?? [] })
}

// POST /api/reels/[id]/versions — admin uploads new version
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params
  const me = await getCurrentUser()
  if (!me)
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
  if (me.user.role !== 'superadmin')
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

  const body = (await req.json().catch(() => ({}))) as {
    asset_url?: string
    full_quality_url?: string
    label?: string
  }

  if (!body.asset_url && !body.full_quality_url)
    return NextResponse.json(
      { error: 'asset_url or full_quality_url required' },
      { status: 400 }
    )

  const supabase = createAdminClient()

  const { data: item, error: fetchErr } = await supabase
    .from('content_items')
    .select('id, org_id, title')
    .eq('id', id)
    .single()

  if (fetchErr || !item)
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  const { data: existing } = await supabase
    .from('content_item_versions')
    .select('version_number')
    .eq('content_item_id', id)
    .order('version_number', { ascending: false })
    .limit(1)

  const nextVersion = (existing?.[0]?.version_number ?? 0) + 1

  const { data: version, error: vErr } = await supabase
    .from('content_item_versions')
    .insert({
      content_item_id: id,
      org_id: item.org_id,
      version_number: nextVersion,
      asset_url: body.asset_url ?? null,
      full_quality_url: body.full_quality_url ?? null,
      label: body.label?.trim() || `v${nextVersion}`,
      uploaded_by: me.user.id,
    })
    .select('*')
    .single()

  if (vErr)
    return NextResponse.json({ error: vErr.message }, { status: 500 })

  const updateFields: Record<string, unknown> = {
    status: 'correction_submitted',
    updated_at: new Date().toISOString(),
  }
  if (body.asset_url) updateFields.asset_url = body.asset_url
  if (body.full_quality_url) updateFields.full_quality_url = body.full_quality_url

  await Promise.all([
    supabase.from('content_items').update(updateFields).eq('id', id),
    supabase.from('activities').insert({
      org_id: item.org_id,
      type: 'reel_version_uploaded',
      title: `New version uploaded: ${item.title}`,
      description: body.label?.trim() || `Version ${nextVersion}`,
      link: '/dashboard/reels',
    }),
  ])

  return NextResponse.json({ data: version })
}
