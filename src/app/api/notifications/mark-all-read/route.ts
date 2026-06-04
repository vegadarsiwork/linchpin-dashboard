import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/db/client'
import { getCurrentUser } from '@/lib/auth'

export async function POST() {
  const me = await getCurrentUser()
  if (!me)
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
  if (!me.user.org_id) {
    return NextResponse.json({ error: 'NO_ORG' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('org_id', me.user.org_id)
    .eq('is_read', false)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
