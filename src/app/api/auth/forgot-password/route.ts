import { NextResponse, type NextRequest } from 'next/server'
import { Resend } from 'resend'
import { createPasswordResetToken } from '@/lib/auth/password-reset'

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? 'Linchpin Studio <studio@linchpinstudio.in>'

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

  const token = await createPasswordResetToken(email)
  if (token && process.env.RESEND_API_KEY) {
    const url = new URL('/dashboard/set-password', req.nextUrl.origin)
    url.searchParams.set('token', token)

    await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Reset your Linchpin Studio password',
      html: `<p>Use this secure link to set your Linchpin Studio password:</p><p><a href="${url.toString()}">Set password</a></p><p>This link expires in 60 minutes.</p>`,
    })
  }

  return NextResponse.json({ ok: true })
}
