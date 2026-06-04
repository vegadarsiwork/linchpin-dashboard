import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/db/client'
import { getCurrentUser } from '@/lib/auth'

interface ProfilePayload {
  full_name?: string | null
  phone?: string | null
}

function sanitiseString(input: unknown, max = 200): string | null {
  if (input === null || input === undefined) return null
  if (typeof input !== 'string') return null
  const trimmed = input.trim()
  if (!trimmed) return null
  return trimmed.slice(0, max)
}

export async function PATCH(req: NextRequest) {
  const me = await getCurrentUser()
  if (!me)
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })

  let body: ProfilePayload
  try {
    body = (await req.json()) as ProfilePayload
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const update: Record<string, unknown> = {}
  if ('full_name' in body) update.full_name = sanitiseString(body.full_name)
  if ('phone' in body) update.phone = sanitiseString(body.phone, 32)

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('users')
    .update(update)
    .eq('id', me.user.id)
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ user: data })
}
