import { NextResponse, type NextRequest } from 'next/server'
import { createPasswordResetToken } from '@/lib/auth/password-reset'

export async function POST(req: NextRequest) {
  let body: { email?: string }
  try {
    body = (await req.json()) as { email?: string }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const email = body.email?.trim()
  if (!email) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
  }

  await createPasswordResetToken(email)

  return NextResponse.json({ ok: true })
}
