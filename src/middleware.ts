import { NextResponse, type NextRequest } from 'next/server'
import { ROLE_COOKIE, SESSION_COOKIE } from '@/lib/auth/cookies'

const PUBLIC_PATHS = new Set<string>([
  '/',
  '/dashboard/login',
  '/dashboard/set-password',
  '/dashboard/forgot-password',
  '/influencer/signup',
  '/influencer/login',
])

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value)
  const role = req.cookies.get(ROLE_COOKIE)?.value
  const isDashboard = pathname.startsWith('/dashboard')
  const isAdmin = pathname.startsWith('/admin')
  const isInfluencer = pathname.startsWith('/influencer')
  const isLogin = pathname === '/dashboard/login'
  const isPublic =
    PUBLIC_PATHS.has(pathname) || pathname.startsWith('/api/auth')

  // UX redirect only. API/server guards perform the actual authorization.
  if (!hasSession && (isDashboard || isAdmin || isInfluencer) && !isPublic) {
    const url = req.nextUrl.clone()
    url.pathname = pathname.startsWith('/influencer') ? '/influencer/login' : '/dashboard/login'
    if (pathname !== '/dashboard') url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  if (hasSession && isLogin) {
    const url = req.nextUrl.clone()
    url.pathname = role === 'influencer' ? '/influencer/dashboard' : '/dashboard'
    url.search = ''
    return NextResponse.redirect(url)
  }

  if (hasSession && pathname === '/influencer/login') {
    const url = req.nextUrl.clone()
    url.pathname = role === 'influencer' ? '/influencer/dashboard' : '/dashboard'
    url.search = ''
    return NextResponse.redirect(url)
  }

  if (hasSession && isAdmin && role !== 'superadmin') {
    const url = req.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  if (hasSession && isInfluencer && !isPublic && role !== 'influencer') {
    const url = req.nextUrl.clone()
    url.pathname = role === 'superadmin' ? '/admin' : '/dashboard'
    return NextResponse.redirect(url)
  }

  return NextResponse.next({ request: req })
}

export const config = {
  matcher: [
    // Run on all paths except static assets, _next internals, and image files.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)).*)',
  ],
}
