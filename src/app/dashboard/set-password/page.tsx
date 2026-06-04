'use client'

import { Suspense, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'

type Strength = 'weak' | 'medium' | 'strong'

function strengthOf(p: string): Strength {
  if (p.length < 8) return 'weak'
  let score = 0
  if (/[a-z]/.test(p)) score++
  if (/[A-Z]/.test(p)) score++
  if (/[0-9]/.test(p)) score++
  if (/[^a-zA-Z0-9]/.test(p)) score++
  if (p.length >= 12) score++
  if (score >= 4) return 'strong'
  if (score >= 2) return 'medium'
  return 'weak'
}

function SetPasswordInner() {
  const router = useRouter()
  const params = useSearchParams()
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const strength = useMemo(() => strengthOf(pw), [pw])
  const pct = strength === 'weak' ? 33 : strength === 'medium' ? 66 : 100
  const barColor =
    strength === 'weak'
      ? 'bg-red-400'
      : strength === 'medium'
        ? 'bg-amber-400'
        : 'bg-emerald-500'

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    if (pw.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (pw !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const res = await fetch('/api/auth/set-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password: pw,
        token: params.get('token'),
      }),
    })
    setLoading(false)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error || 'Unable to set password.')
      return
    }

    toast.success('Password set. Welcome aboard.')
    router.replace('/dashboard')
    router.refresh()
  }

  return (
    <div className="auth-shell relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#f6f4ef] px-4 py-12 text-zinc-950">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-zinc-950/10" />
      <div className="pointer-events-none absolute left-1/2 top-[-18rem] h-[32rem] w-[44rem] -translate-x-1/2 rounded-full bg-white/70 blur-3xl" />
      <div className="relative w-full max-w-md">
        <Card>
          <CardContent className="pt-6">
            <h1 className="mb-1 text-2xl font-semibold text-zinc-900">
              Welcome to Linchpin Studio
            </h1>
            <p className="mb-6 text-sm text-zinc-500">Set your password</p>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pw">New password</Label>
                <Input
                  id="pw"
                  type="password"
                  required
                  minLength={8}
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                />
                {pw.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className={`h-full transition-all duration-300 ${barColor}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs capitalize text-zinc-500">
                      Strength: {strength}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm password</Label>
                <Input
                  id="confirm"
                  type="password"
                  required
                  minLength={8}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
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
                    Saving...
                  </>
                ) : (
                  'Set password & continue'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <SetPasswordInner />
    </Suspense>
  )
}
