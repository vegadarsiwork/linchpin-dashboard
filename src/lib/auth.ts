import { query, queryOne } from '@/lib/db'
import { getSessionUserId } from '@/lib/auth/sessions'
import type { Organisation, User } from '@/lib/types'

export type CurrentUser = {
  user: User
  org: Organisation | null
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const userId = await getSessionUserId()
  if (!userId) return null

  const profile = await queryOne<User>('select * from users where id = $1', [
    userId,
  ])
  if (!profile) return null

  let org: Organisation | null = null
  if (profile.org_id) {
    org = await queryOne<Organisation>(
      'select * from organisations where id = $1',
      [profile.org_id]
    )
  }

  await query('update users set last_seen_at = now() where id = $1', [userId])

  return { user: profile, org }
}

export async function requireSuperadmin(): Promise<CurrentUser> {
  const me = await getCurrentUser()
  if (!me) throw new Error('UNAUTHENTICATED')
  if (me.user.role !== 'superadmin') throw new Error('FORBIDDEN')
  return me
}

export async function requireClient(): Promise<CurrentUser> {
  const me = await getCurrentUser()
  if (!me) throw new Error('UNAUTHENTICATED')
  if (me.user.role !== 'client') throw new Error('FORBIDDEN')
  return me
}

export async function requireInfluencer(): Promise<CurrentUser> {
  const me = await getCurrentUser()
  if (!me) throw new Error('UNAUTHENTICATED')
  if (me.user.role !== 'influencer') throw new Error('FORBIDDEN')
  return me
}
