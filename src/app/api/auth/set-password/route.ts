import { NextResponse, type NextRequest } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { hashPassword, verifyPassword } from '@/lib/auth/crypto'
import { consumePasswordResetToken } from '@/lib/auth/password-reset'
import { createSession, getSessionUserId } from '@/lib/auth/sessions'
import type { UserRole } from '@/lib/types'

export async function POST(req: NextRequest) {
  let body: {
    password?: string
    token?: string | null
    current_password?: string | null
  }
  try {
    body = (await req.json()) as {
      password?: string
      token?: string | null
      current_password?: string | null
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const password = body.password ?? ''
  if (password.length < 8) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters.' },
      { status: 400 }
    )
  }

  const isResetFlow = Boolean(body.token)
  const userId = isResetFlow
    ? await consumePasswordResetToken(body.token!)
    : await getSessionUserId()

  if (!userId) {
    return NextResponse.json(
      { error: 'Password link is invalid or expired.' },
      { status: 401 }
    )
  }

  const user = await queryOne<{
    id: string
    role: UserRole
    password_hash: string | null
  }>('select id, role, password_hash from users where id = $1', [userId])

  if (!user) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 })
  }

  if (!isResetFlow && user.password_hash) {
    const currentPassword = body.current_password ?? ''
    if (!verifyPassword(currentPassword, user.password_hash)) {
      return NextResponse.json(
        { error: 'Current password is incorrect.' },
        { status: 403 }
      )
    }
  }

  await query(
    `update users
        set password_hash = $1,
            password_set_at = now(),
            last_seen_at = now()
      where id = $2`,
    [hashPassword(password), userId]
  )

  if (user) await createSession(user)

  return NextResponse.json({ ok: true })
}
