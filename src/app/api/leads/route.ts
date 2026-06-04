import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/db/client'
import { getCurrentUser } from '@/lib/auth'

const ALLOWED_STATUSES = new Set([
  'new',
  'contacted',
  'qualified',
  'converted',
  'lost',
])

const ALLOWED_SOURCES = new Set([
  'zap_whatsapp',
  'cold_email',
  'linkedin',
  'landing_page',
  'meta_ads',
  'reel',
  'referral',
  'manual',
])

export async function GET(req: NextRequest) {
  const me = await getCurrentUser()
  if (!me)
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
  if (!me.user.org_id)
    return NextResponse.json({ error: 'NO_ORG' }, { status: 403 })

  const url = req.nextUrl
  const status = url.searchParams.get('status')
  const limit = Math.min(
    Math.max(Number(url.searchParams.get('limit')) || 100, 1),
    500
  )
  const offset = Math.max(Number(url.searchParams.get('offset')) || 0, 0)

  const supabase = createAdminClient()
  let q = supabase
    .from('leads')
    .select('*', { count: 'exact' })
    .eq('org_id', me.user.org_id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status && status !== 'all' && ALLOWED_STATUSES.has(status)) {
    q = q.eq('status', status)
  }

  const { data, error, count } = await q
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [], count: count ?? 0 })
}

interface CreateLeadBody {
  name?: string
  phone?: string
  email?: string
  source?: string
  source_detail?: string
  notes?: string
  follow_up_at?: string | null
  follow_up_note?: string | null
}

export async function POST(req: NextRequest) {
  const me = await getCurrentUser()
  if (!me)
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
  if (!me.user.org_id)
    return NextResponse.json({ error: 'NO_ORG' }, { status: 403 })

  const body = (await req.json().catch(() => ({}))) as CreateLeadBody

  const name = (body.name ?? '').trim() || null
  const phone = (body.phone ?? '').trim() || null
  const email = (body.email ?? '').trim() || null

  if (!name && !phone && !email) {
    return NextResponse.json(
      { error: 'At least one of name, phone, or email is required.' },
      { status: 400 }
    )
  }

  const source = (body.source ?? 'manual').trim()
  if (!ALLOWED_SOURCES.has(source)) {
    return NextResponse.json({ error: 'INVALID_SOURCE' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: lead, error } = await supabase
    .from('leads')
    .insert({
      org_id: me.user.org_id,
      name,
      phone,
      email,
      source,
      source_detail: body.source_detail ?? null,
      notes: body.notes ?? null,
      follow_up_at: body.follow_up_at ?? null,
      follow_up_note: body.follow_up_note ?? null,
      status: 'new',
    })
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await supabase.from('activities').insert({
    org_id: me.user.org_id,
    type: 'lead_received',
    title: `New lead: ${name ?? email ?? phone}`,
    description: body.notes ?? null,
    link: '/dashboard/leads',
  })

  return NextResponse.json({ data: lead }, { status: 201 })
}
