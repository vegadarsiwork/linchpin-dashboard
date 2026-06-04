'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setLoading(false)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error || 'Unable to send reset link.')
      return
    }
    setSent(true)
  }

  return (
    <div className="auth-shell relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#f6f4ef] px-4 py-12 text-zinc-950">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-zinc-950/10" />
      <div className="pointer-events-none absolute left-1/2 top-[-18rem] h-[32rem] w-[44rem] -translate-x-1/2 rounded-full bg-white/70 blur-3xl" />
      <div className="relative w-full max-w-md">
        <Card>
          <CardContent className="pt-6">
            {sent ? (
              <div className="py-4 text-center">
                <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-500" />
                <h1 className="mb-1 text-xl font-semibold text-zinc-900">
                  Check your email
                </h1>
                <p className="mb-6 text-sm text-zinc-500">
                  We sent a reset link to{' '}
                  <span className="font-medium text-zinc-700">{email}</span>.
                </p>
                <Link
                  href="/dashboard/login"
                  className="text-sm text-[#7C3AED] hover:underline"
                >
                  Back to sign in
                </Link>
              </div>
            ) : (
              <>
                <h1 className="mb-1 text-2xl font-semibold text-zinc-900">
                  Reset password
                </h1>
                <p className="mb-6 text-sm text-zinc-500">
                  Enter your email. We&apos;ll send you a reset link.
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

                  {error && (
                    <div
                      role="alert"
                      className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600"
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
                        Sending...
                      </>
                    ) : (
                      'Send reset link'
                    )}
                  </Button>

                  <div className="pt-1 text-center">
                    <Link
                      href="/dashboard/login"
                      className="text-sm text-[#7C3AED] hover:underline"
                    >
                      Back to sign in
                    </Link>
                  </div>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
