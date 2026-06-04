import { NextResponse, type NextRequest } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { verifyPassword } from '@/lib/auth/crypto'
import { createSession } from '@/lib/auth/sessions'
import type { UserRole } from '@/lib/types'

type LoginUser = {
  id: string
  email: string
  role: UserRole
  password_hash: string | null
}

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string }
  try {
    body = (await req.json()) as { email?: string; password?: string }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const email = body.email?.trim().toLowerCase()
  const password = body.password ?? ''
  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required.' },
      { status: 400 }
    )
  }

  const user = await queryOne<LoginUser>(
    'select id, email, role, password_hash from users where lower(email) = lower($1)',
    [email]
  )

  if (!user || !verifyPassword(password, user.password_hash)) {
    return NextResponse.json(
      { error: 'Invalid email or password.' },
      { status: 401 }
    )
  }

  await createSession(user)
  await query('update users set last_seen_at = now() where id = $1', [user.id])

  return NextResponse.json({ ok: true, role: user.role })
}
