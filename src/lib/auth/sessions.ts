import { cookies } from 'next/headers'
import { query, queryOne } from '@/lib/db'
import type { UserRole } from '@/lib/types'
import { hashToken, randomToken } from './crypto'
import { ROLE_COOKIE, SESSION_COOKIE } from './cookies'

const SESSION_DAYS = 30
const SESSION_MAX_AGE = SESSION_DAYS * 24 * 60 * 60

type SessionUserRow = {
  id: string
  role: UserRole
}

function expiresAt(): Date {
  return new Date(Date.now() + SESSION_MAX_AGE * 1000)
}

export async function createSession(user: SessionUserRow): Promise<void> {
  const token = randomToken()
  const tokenHash = hashToken(token)
  const expires = expiresAt()

  await query(
    `insert into app_sessions (user_id, token_hash, expires_at)
     values ($1, $2, $3)`,
    [user.id, tokenHash, expires.toISOString()]
  )

  const jar = await cookies()
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })
  jar.set(ROLE_COOKIE, user.role, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })
}

export async function destroySession(): Promise<void> {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  if (token) {
    await query('delete from app_sessions where token_hash = $1', [
      hashToken(token),
    ])
  }
  jar.delete(SESSION_COOKIE)
  jar.delete(ROLE_COOKIE)
}

export async function getSessionUserId(): Promise<string | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!token) return null

  const row = await queryOne<{ user_id: string }>(
    `select user_id
       from app_sessions
      where token_hash = $1
        and expires_at > now()`,
    [hashToken(token)]
  )
  return row?.user_id ?? null
}
