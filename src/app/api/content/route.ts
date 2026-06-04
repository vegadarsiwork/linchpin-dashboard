import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/db/client'
import { getCurrentUser } from '@/lib/auth'

type OrgUserContact = {
  id: string
}

const ALLOWED_STATUSES = new Set([
  'draft',
  'pending_approval',
  'review',
  'scheduled',
  'published',
  'rejected',
  'approved',
  'correction_requested',
  'correction_submitted',
  'revised',
  'final_approved',
])

// ─────────────────────────────────────────────────────────────────────
// GET /api/content?orgId=&status=&limit=&offset=
// ─────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const me = await getCurrentUser()
  if (!me)
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })

  const url = new URL(req.url)
  const orgId = url.searchParams.get('orgId') ?? me.user.org_id
  const status = url.searchParams.get('status')
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 50), 200)
  const offset = Math.max(0, Number(url.searchParams.get('offset') ?? 0))

  if (!orgId)
    return NextResponse.json({ error: 'NO_ORG' }, { status: 400 })

  if (me.user.role !== 'superadmin' && orgId !== me.user.org_id) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  }

  const supabase = createAdminClient()
  let query = supabase
    .from('content_items')
    .select('*', { count: 'exact' })
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) query = query.eq('status', status)

  const { data, count, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, count })
}

// ─────────────────────────────────────────────────────────────────────
// POST /api/content — superadmin only — create new content_item
// ─────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const me = await getCurrentUser()
  if (!me)
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
  if (me.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  }

  const body = (await req.json().catch(() => ({}))) as {
    org_id?: string
    title?: string
    type?: string
    platform?: string | null
    caption?: string | null
    hashtags?: string[]
    asset_url?: string | null
    asset_type?: string | null
    asset_size_mb?: number | null
    full_quality_url?: string | null
    media_asset_id?: string | null
    thumbnail_media_asset_id?: string | null
    scheduled_for?: string | null
    script_id?: string | null
    influencer_id?: string | null
    status?: string
  }

  if (!body.org_id || !body.title) {
    return NextResponse.json(
      { error: 'org_id and title required' },
      { status: 400 }
    )
  }
  if (body.status && !ALLOWED_STATUSES.has(body.status)) {
    return NextResponse.json({ error: 'INVALID_STATUS' }, { status: 400 })
  }

  const insert = {
    org_id: body.org_id,
    title: body.title.trim(),
    type: body.type ?? 'reel',
    platform: body.platform ?? null,
    caption: body.caption ?? null,
    hashtags: body.hashtags ?? [],
    asset_url: body.asset_url ?? null,
    asset_type: body.asset_type ?? null,
    asset_size_mb: body.asset_size_mb ?? null,
    full_quality_url: body.full_quality_url ?? null,
    media_asset_id: body.media_asset_id || null,
    thumbnail_media_asset_id: body.thumbnail_media_asset_id || null,
    scheduled_for: body.scheduled_for ?? null,
    script_id: body.script_id || null,
    influencer_id: body.influencer_id || null,
    status: body.status ?? 'pending_approval',
  }

  // Use admin client — superadmin row, RLS-policy-allowed but bypass to keep
  // the path simple regardless of policy details.
  const admin = createAdminClient()
  const { data: created, error } = await admin
    .from('content_items')
    .insert(insert)
    .select('*')
    .single()
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Activity + notifications side-effects (best-effort)
  try {
    await admin.from('activities').insert({
      org_id: insert.org_id,
      type: 'reel_submitted',
      title: `New reel: ${insert.title}`,
      description: 'Waiting for your approval',
      link: '/dashboard/reels',
    })

    const { data: orgUsers } = await admin
      .from('users')
      .select('id, email')
      .eq('org_id', insert.org_id)
      .eq('role', 'client')

    const contacts = (orgUsers ?? []) as OrgUserContact[]

    if (contacts.length > 0) {
      const rows = contacts.map((u) => ({
        org_id: insert.org_id,
        user_id: u.id,
        type: 'info',
        title: 'New reel ready for approval',
        body: insert.title,
        link: '/dashboard/reels',
        channels: ['in_app'],
      }))
      await admin.from('notifications').insert(rows)

    }
  } catch {
    // swallow side-effect errors
  }

  return NextResponse.json({ data: created })
}
