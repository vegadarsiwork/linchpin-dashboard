import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export type GuardResult =
  | { ok: true; userId: string }
  | { ok: false; res: NextResponse }

export async function requireSuperadminAPI(): Promise<GuardResult> {
  const me = await getCurrentUser()
  if (!me) {
    return {
      ok: false,
      res: NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 }),
    }
  }
  if (me.user.role !== 'superadmin') {
    return {
      ok: false,
      res: NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 }),
    }
  }
  return { ok: true, userId: me.user.id }
}
