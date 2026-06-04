import { NextResponse, type NextRequest } from 'next/server'
import { Resend } from 'resend'
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

type UserRow = {
  email: string
  full_name: string | null
}

function authorize(req: NextRequest): boolean {
  // Vercel Cron sets this header automatically. Also accept a manual bearer for local testing.
  const cronHeader = req.headers.get('x-vercel-cron')
  if (cronHeader) return true

  const secret = process.env.CRON_SECRET
  if (!secret) {
    // No secret configured — only allow via Vercel cron header.
    return false
  }
  const auth = req.headers.get('authorization') ?? ''
  return auth === `Bearer ${secret}`
}

export async function GET(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const admin = createAdminClient()

  const now = new Date()
  const windowStart = new Date(now.getTime() - 60 * 60 * 1000) // 1 hour ago

  // Pull leads whose follow_up_at fell within the last hour and are still in play.
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

  // Pull org statuses to skip non-active orgs.
  const orgIds = Array.from(new Set(leads.map((l) => l.org_id)))
  const { data: orgsData } = await admin
    .from('organisations')
    .select('id, name, status')
    .in('id', orgIds)

  const activeOrgs = new Map<string, OrgRow>()
  for (const o of (orgsData ?? []) as OrgRow[]) {
    if (!o.status || o.status === 'active') {
      activeOrgs.set(o.id, o)
    }
  }

  // Pull org client users (for email recipients).
  const { data: usersData } = await admin
    .from('users')
    .select('email, full_name, org_id, role')
    .in('org_id', orgIds)
    .eq('role', 'client')

  const usersByOrg = new Map<string, UserRow[]>()
  for (const u of (usersData ?? []) as (UserRow & { org_id: string })[]) {
    if (!u.email) continue
    const list = usersByOrg.get(u.org_id) ?? []
    list.push({ email: u.email, full_name: u.full_name })
    usersByOrg.set(u.org_id, list)
  }

  // Pull notifications already sent for these leads in the last 24h to dedupe.
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

  const resendKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM ?? 'Linchpin Studio <hello@linchpinsoftsolution.com>'
  const resend = resendKey ? new Resend(resendKey) : null

  let processed = 0

  for (const lead of leads) {
    const org = activeOrgs.get(lead.org_id)
    if (!org) continue

    const dedupeKey = `${lead.org_id}:${lead.id}`
    if (recentlyNotified.has(dedupeKey)) continue

    const display = lead.name ?? lead.email ?? lead.phone ?? 'a lead'
    const noteSuffix = lead.follow_up_note
      ? `: ${lead.follow_up_note}`
      : ''
    const dateText = lead.follow_up_at
      ? formatFollowUpDate(lead.follow_up_at)
      : ''

    // 1. Notification row in-app
    await admin.from('notifications').insert({
      org_id: lead.org_id,
      type: 'follow_up_reminder',
      title: `Follow up with ${display}`,
      body: lead.follow_up_note ?? `Reminder set for ${dateText}`,
      link: `/dashboard/leads?lead=${lead.id}`,
      channels: ['in_app', 'email'],
    })

    // 2. Email (best effort)
    if (resend) {
      const recipients = (usersByOrg.get(lead.org_id) ?? []).map((u) => u.email)
      if (recipients.length > 0) {
        try {
          await resend.emails.send({
            from: fromEmail,
            to: recipients,
            subject: `Follow up with ${display}${noteSuffix}`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 540px; margin: 0 auto; padding: 24px;">
                <h2 style="color: #18181b; margin: 0 0 8px 0;">⏰ Follow-up reminder</h2>
                <p style="color: #52525b; margin: 0 0 16px 0;">
                  You set a reminder for <strong>${escapeHtml(display)}</strong>${dateText ? ` on ${escapeHtml(dateText)}` : ''}.
                </p>
                ${
                  lead.follow_up_note
                    ? `<div style="background:#fef3c7; border-radius:8px; padding:12px 14px; color:#78350f; font-size:14px; margin-bottom:16px;">${escapeHtml(lead.follow_up_note)}</div>`
                    : ''
                }
                <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://linchpinsoftsolution.com'}/dashboard/leads?lead=${lead.id}"
                   style="display:inline-block; background:#7C3AED; color:#fff; padding:10px 18px; border-radius:8px; text-decoration:none; font-weight:600; font-size:14px;">
                  Open lead
                </a>
                <p style="color:#a1a1aa; font-size:12px; margin-top:24px;">
                  Sent by Linchpin Studio · ${escapeHtml(org.name)}
                </p>
              </div>
            `,
          })

          // Mark notification email as sent
          await admin
            .from('notifications')
            .update({ sent_email: true })
            .eq('org_id', lead.org_id)
            .eq('type', 'follow_up_reminder')
            .eq('link', `/dashboard/leads?lead=${lead.id}`)
            .gte('created_at', new Date(now.getTime() - 5 * 60 * 1000).toISOString())
        } catch {
          // Swallow — notification row is still in DB, retry next hour.
        }
      }
    }

    processed += 1
  }

  return NextResponse.json({ processed })
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
