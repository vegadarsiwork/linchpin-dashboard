// Server-only notification dispatcher. External delivery channels are disabled
// for now; every notification is stored in-app only.

import { createAdminClient } from '@/lib/db/client'
import type { NotificationChannel, User } from '@/lib/types'

export interface NotificationPayload {
  orgId: string
  userId?: string | null
  type: string
  title: string
  body?: string | null
  link?: string | null
  channels?: NotificationChannel[]
}

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

export async function sendNotification({
  orgId,
  userId = null,
  type,
  title,
  body = null,
  link = null,
}: NotificationPayload): Promise<{ id: string | null }> {
  const admin = createAdminClient()
  const recipient = userId ? await getUserById(userId) : await getUserByOrgId(orgId)

  const { data: row, error } = await admin
    .from('notifications')
    .insert({
      org_id: orgId,
      user_id: recipient?.id ?? null,
      type,
      title,
      body,
      link,
      channels: ['in_app'],
      is_read: false,
    })
    .select('id')
    .single()

  if (error || !row) {
    console.error('[notifications] insert failed', error)
    return { id: null }
  }

  return { id: row.id as string }
}
