import { NextResponse, type NextRequest } from 'next/server'

// Legacy auth callback endpoint. New password reset links go directly to
// /dashboard/set-password?token=... and app sessions are managed by /api/auth.
export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL('/dashboard/login', req.url))
}
