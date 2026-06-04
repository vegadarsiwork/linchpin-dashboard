import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/db/client'
import { getCurrentUser } from '@/lib/auth'
import type { NotificationChannel, NotificationPrefs } from '@/lib/types'

const VALID_CHANNELS: NotificationChannel[] = ['in_app']
const VALID_KEYS = new Set([
  'new_lead',
  'reel_approval',
  'followup',
  'deliverable',
  'escalation',
])

interface PrefsPayload {
  notification_prefs?: unknown
}

function sanitisePrefs(input: unknown): NotificationPrefs | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null
  const out: NotificationPrefs = {}
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (!VALID_KEYS.has(k)) continue
    if (!Array.isArray(v)) continue
    const channels = v.filter(
      (c): c is NotificationChannel =>
        typeof c === 'string' && (VALID_CHANNELS as string[]).includes(c)
    )
    // in_app is always implicitly on; persist it for clarity.
    if (!channels.includes('in_app')) channels.unshift('in_app')
    out[k] = channels
  }
  return out
}

export async function PATCH(req: NextRequest) {
  const me = await getCurrentUser()
  if (!me)
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })

  let body: PrefsPayload
  try {
    body = (await req.json()) as PrefsPayload
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const prefs = sanitisePrefs(body.notification_prefs)
  if (!prefs) {
    return NextResponse.json(
      { error: 'notification_prefs must be an object' },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('users')
    .update({ notification_prefs: prefs })
    .eq('id', me.user.id)
    .select('id, notification_prefs')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ notification_prefs: data?.notification_prefs })
}
