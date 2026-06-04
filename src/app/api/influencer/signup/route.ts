import { randomUUID } from 'crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { getPool, query, queryOne } from '@/lib/db'
import { hashPassword } from '@/lib/auth/crypto'
import { createSession } from '@/lib/auth/sessions'
import type { UserRole } from '@/lib/types'

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

export async function POST(req: NextRequest) {
  let body: {
    full_name?: string
    email?: string
    password?: string
    city?: string
    primary_niche?: string
    phone?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const fullName = body.full_name?.trim()
  const email = body.email?.trim().toLowerCase()
  const password = body.password ?? ''

  if (!fullName || !email) {
    return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
  }

  const existing = await queryOne<{ id: string }>(
    'select id from users where lower(email) = lower($1)',
    [email]
  )
  if (existing) {
    return NextResponse.json({ error: 'An account already exists for this email.' }, { status: 409 })
  }

  const userId = randomUUID()
  const baseSlug = slugify(fullName) || `creator-${userId.slice(0, 8)}`
  const slug = `${baseSlug}-${userId.slice(0, 6)}`
  const role: UserRole = 'influencer'

  const client = await getPool().connect()
  try {
    await client.query('begin')
    await client.query(
      `insert into users (id, email, full_name, role, password_hash, password_set_at)
       values ($1, $2, $3, 'influencer', $4, now())`,
      [userId, email, fullName, hashPassword(password)]
    )

    await client.query(
      `insert into influencers (
        user_id, slug, name, display_name, city, niches, platform, availability,
        approval_status, public_visible, public_profile_completed, active
      ) values ($1, $2, $3, $3, $4, $5, 'Instagram', 'active', 'draft', false, false, true)`,
      [
        userId,
        slug,
        fullName,
        body.city?.trim() || null,
        body.primary_niche?.trim() ? [body.primary_niche.trim()] : [],
      ]
    )

    await client.query('commit')
  } catch (error) {
    await client.query('rollback').catch(() => {})
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create influencer account.' },
      { status: 500 }
    )
  } finally {
    client.release()
  }

  const phone = body.phone?.trim()
  if (phone) {
    await query('update users set phone = $1 where id = $2', [phone.slice(0, 20), userId])
  }

  await createSession({ id: userId, role })
  return NextResponse.json({ ok: true }, { status: 201 })
}
