import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/db/client'
import { formatFollowUpDate } from '@/components/studio/leads/leadConstants'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type LeadRow = {
  id: string
  org_id: string
  name: string | null
  phone: string | null
  email: string | null
  follow_up_at: string | null
  follow_up_note: string | null
  status: string
}

type OrgRow = {
  id: string
  name: string
  status: string | null
}

function authorize(req: NextRequest): boolean {
  const cronHeader = req.headers.get('x-vercel-cron')
  if (cronHeader) return true

  const secret = process.env.CRON_SECRET
  if (!secret) return false

  const auth = req.headers.get('authorization') ?? ''
  return auth === `Bearer ${secret}`
}

export async function GET(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const admin = createAdminClient()
  const now = new Date()
  const windowStart = new Date(now.getTime() - 60 * 60 * 1000)

  const { data: leadsData, error: leadsErr } = await admin
    .from('leads')
    .select('id, org_id, name, phone, email, follow_up_at, follow_up_note, status')
    .gte('follow_up_at', windowStart.toISOString())
    .lte('follow_up_at', now.toISOString())
    .not('status', 'in', '(converted,lost)')

  if (leadsErr) {
    return NextResponse.json({ error: leadsErr.message }, { status: 500 })
  }

  const leads = (leadsData ?? []) as LeadRow[]
  if (leads.length === 0) {
    return NextResponse.json({ processed: 0 })
  }

  const orgIds = Array.from(new Set(leads.map((l) => l.org_id)))
  const { data: orgsData } = await admin
    .from('organisations')
    .select('id, name, status')
    .in('id', orgIds)

  const activeOrgs = new Map<string, OrgRow>()
  for (const org of (orgsData ?? []) as OrgRow[]) {
    if (!org.status || org.status === 'active') {
      activeOrgs.set(org.id, org)
    }
  }

  const dedupeWindow = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
  const { data: existingNotifs } = await admin
    .from('notifications')
    .select('id, org_id, link, type, created_at')
    .eq('type', 'follow_up_reminder')
    .gte('created_at', dedupeWindow)
    .in('org_id', orgIds)

  const recentlyNotified = new Set<string>()
  for (const n of (existingNotifs ?? []) as { org_id: string; link: string | null }[]) {
    const id = n.link?.split('lead=')[1]
    if (id) recentlyNotified.add(`${n.org_id}:${id}`)
  }

  let processed = 0

  for (const lead of leads) {
    const org = activeOrgs.get(lead.org_id)
    if (!org) continue

    const dedupeKey = `${lead.org_id}:${lead.id}`
    if (recentlyNotified.has(dedupeKey)) continue

    const display = lead.name ?? lead.email ?? lead.phone ?? 'a lead'
    const dateText = lead.follow_up_at
      ? formatFollowUpDate(lead.follow_up_at)
      : ''

    await admin.from('notifications').insert({
      org_id: lead.org_id,
      type: 'follow_up_reminder',
      title: `Follow up with ${display}`,
      body: lead.follow_up_note ?? `Reminder set for ${dateText}`,
      link: `/dashboard/leads?lead=${lead.id}`,
      channels: ['in_app'],
    })

    processed += 1
  }

  return NextResponse.json({ processed })
}
