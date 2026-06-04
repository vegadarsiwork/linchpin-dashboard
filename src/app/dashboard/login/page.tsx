'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'

function Wordmark() {
  return (
    <div className="flex items-center justify-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-950 text-lg font-bold text-white shadow-sm">
        L
      </div>
      <span className="text-xl font-semibold tracking-tight text-zinc-900">
        Linchpin Studio
      </span>
    </div>
  )
}

function LoginInner() {
  const router = useRouter()
  const params = useSearchParams()
  const redirectTo = params.get('redirect') || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(data.error || 'Invalid email or password.')
      setLoading(false)
      return
    }

    router.replace(data.role === 'influencer' ? '/influencer/dashboard' : redirectTo)
    router.refresh()
  }

  return (
    <div className="auth-shell relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#f6f4ef] px-4 py-12 text-zinc-950">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-zinc-950/10" />
      <div className="pointer-events-none absolute left-1/2 top-[-18rem] h-[32rem] w-[44rem] -translate-x-1/2 rounded-full bg-white/70 blur-3xl" />
      <div className="relative w-full max-w-md">
        <div className="mb-8">
          <Wordmark />
        </div>

        <Card>
          <CardContent className="pt-6">
            <h1 className="text-2xl font-semibold text-zinc-900 mb-1">
              Welcome back
            </h1>
            <p className="text-sm text-zinc-500 mb-6">
              Sign in to your dashboard
            </p>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.in"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/dashboard/forgot-password"
                    className="text-sm text-[#7C3AED] hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="password"
                />
              </div>

              {error && (
                <div
                  role="alert"
                  className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2"
                >
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>
            <div className="mt-5 border-t border-zinc-100 pt-4 text-center text-sm text-zinc-500">
              Creator?{' '}
              <Link href="/influencer/signup" className="font-medium text-zinc-950 underline">
                Join the marketplace
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-zinc-400 text-center mt-6">
          Linchpin Studio
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  )
}
