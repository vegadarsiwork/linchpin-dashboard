// Server-only notification dispatcher. Writes the in_app row, then optionally
// fans out to email (Resend) and WhatsApp (Meta Cloud API). Channel selection
// respects the recipient user's notification_prefs.

import { Resend } from 'resend'
import { createAdminClient } from '@/lib/db/client'
import { StudioNotificationEmail } from '@/components/emails/StudioNotificationEmail'
import type { NotificationChannel, User } from '@/lib/types'

export interface NotificationPayload {
  orgId: string
  userId?: string | null
  type: string
  title: string
  body?: string | null
  link?: string | null
  /** Channels the *caller* requested. Filtered against user prefs. */
  channels?: NotificationChannel[]
}

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? 'Linchpin Studio <studio@linchpinstudio.in>'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

/**
 * Pick the org's primary contact (first client user). Used when no explicit
 * userId is passed to sendNotification.
 */
async function getUserByOrgId(orgId: string): Promise<User | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('users')
    .select('*')
    .eq('org_id', orgId)
    .eq('role', 'client')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle<User>()
  return data
}

async function getUserById(userId: string): Promise<User | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle<User>()
  return data
}

function effectiveChannels(
  user: User | null,
  type: string,
  requested: NotificationChannel[]
): NotificationChannel[] {
  // in_app is always on.
  const out = new Set<NotificationChannel>(['in_app'])
  const prefs = user?.notification_prefs?.[type]
  for (const ch of requested) {
    if (ch === 'in_app') continue
    if (!prefs || prefs.includes(ch)) out.add(ch)
  }
  return Array.from(out)
}

export async function sendNotification({
  orgId,
  userId = null,
  type,
  title,
  body = null,
  link = null,
  channels = ['in_app'],
}: NotificationPayload): Promise<{ id: string | null }> {
  const admin = createAdminClient()
  const recipient = userId ? await getUserById(userId) : await getUserByOrgId(orgId)
  const finalChannels = effectiveChannels(recipient, type, channels)

  // 1) Always create the in_app row first so we have an id to update.
  const { data: row, error } = await admin
    .from('notifications')
    .insert({
      org_id: orgId,
      user_id: recipient?.id ?? null,
      type,
      title,
      body,
      link,
      channels: finalChannels,
      is_read: false,
    })
    .select('id')
    .single()

  if (error || !row) {
    console.error('[notifications] insert failed', error)
    return { id: null }
  }

  const notificationId = row.id as string

  // 2) Fan out — failures are logged but never throw, so the in_app
  //    notification remains visible even if email/whatsapp dies.
  await Promise.all([
    finalChannels.includes('email') && recipient?.email
      ? deliverEmail({ notificationId, to: recipient.email, title, body, link })
      : Promise.resolve(),
    finalChannels.includes('whatsapp') && recipient?.phone
      ? deliverWhatsApp({ notificationId, phone: recipient.phone, title, body })
      : Promise.resolve(),
  ])

  return { id: notificationId }
}

async function deliverEmail(args: {
  notificationId: string
  to: string
  title: string
  body: string | null
  link: string | null
}) {
  if (!resend) {
    console.warn('[notifications] RESEND_API_KEY missing; skipping email')
    return
  }
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: args.to,
      subject: args.title,
      react: StudioNotificationEmail({
        title: args.title,
        body: args.body,
        ctaLink: args.link,
      }),
    })
    const admin = createAdminClient()
    await admin
      .from('notifications')
      .update({ sent_email: true })
      .eq('id', args.notificationId)
  } catch (err) {
    console.error('[notifications] email send failed', err)
  }
}

async function deliverWhatsApp(args: {
  notificationId: string
  phone: string
  title: string
  body: string | null
}) {
  try {
    await sendWhatsAppNotification(args.phone, args.title, args.body ?? '')
    const admin = createAdminClient()
    await admin
      .from('notifications')
      .update({ sent_whatsapp: true })
      .eq('id', args.notificationId)
  } catch (err) {
    console.error('[notifications] whatsapp send failed', err)
  }
}

export async function sendWhatsAppNotification(
  phone: string,
  title: string,
  body: string
): Promise<void> {
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const token = process.env.WHATSAPP_API_TOKEN
  if (!phoneId || !token) {
    console.warn('[notifications] WhatsApp env vars missing; skipping')
    return
  }
  const cleaned = phone.replace(/[^0-9]/g, '')
  if (!cleaned) return

  const res = await fetch(
    `https://graph.facebook.com/v18.0/${phoneId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: cleaned,
        type: 'template',
        template: {
          name: 'studio_notification',
          language: { code: 'en' },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: title },
                { type: 'text', text: body || ' ' },
              ],
            },
          ],
        },
      }),
    }
  )

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`WhatsApp API ${res.status}: ${text}`)
  }
}
