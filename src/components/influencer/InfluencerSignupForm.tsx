'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

function inputClass() {
  return 'h-11 w-full rounded-md border border-zinc-200 bg-[#fbfaf7] px-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-[#7c3aed] focus:bg-white focus:ring-2 focus:ring-violet-100'
}

export function InfluencerSignupForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    city: '',
    primary_niche: '',
  })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await fetch('/api/influencer/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const json = await res.json().catch(() => ({}))
    setLoading(false)
    if (!res.ok) {
      setError(json.error ?? 'Could not create account.')
      return
    }
    router.replace('/influencer/dashboard')
    router.refresh()
  }

  return (
    <main className="auth-shell min-h-[100dvh] bg-[#f6f4ef] px-4 py-8 text-zinc-950">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-px bg-zinc-950/10" />
      <div className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <section>
          <Link href="/dashboard/login" className="mb-8 flex w-fit items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-950 text-sm font-semibold text-white shadow-sm">L</div>
            <div>
              <div className="text-sm font-semibold leading-tight text-zinc-950">Creator Studio</div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Linchpin marketplace</div>
            </div>
          </Link>
          <div className="mb-5 inline-flex rounded-md border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600 shadow-sm">
            Managed creator marketplace
          </div>
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-zinc-950 md:text-5xl">
            Put your trial reels in front of brands without chasing DMs.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-zinc-600">
            Build a Linchpin-approved creator profile, upload GIF previews, and respond to campaign requests from one place. Linchpin handles client coordination.
          </p>
          <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
            {['Profile review', 'GIF previews', 'No direct negotiation'].map((item) => (
              <div key={item} className="border-t border-zinc-200 pt-3 text-sm font-medium text-zinc-700">{item}</div>
            ))}
          </div>
        </section>

        <form onSubmit={submit} className="rounded-lg border border-zinc-200/80 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-zinc-950">Create creator account</h2>
            <p className="mt-1 text-sm text-zinc-500">Your profile stays private until Linchpin approves it.</p>
          </div>
          <div className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-zinc-800">Creator name</span>
              <input className={inputClass()} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-zinc-800">Email</span>
              <input className={inputClass()} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-zinc-800">Phone</span>
              <input className={inputClass()} type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-zinc-800">Password</span>
              <input className={inputClass()} type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-zinc-800">City</span>
                <input className={inputClass()} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-zinc-800">Primary niche</span>
                <input className={inputClass()} value={form.primary_niche} onChange={(e) => setForm({ ...form, primary_niche: e.target.value })} />
              </label>
            </div>
          </div>
          {error && <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <button disabled={loading} className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#7c3aed] text-sm font-semibold text-white transition hover:bg-[#6d28d9] active:translate-y-px disabled:opacity-60">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Create account
          </button>
          <p className="mt-4 text-center text-sm text-zinc-500">
            Already joined? <Link href="/influencer/login" className="font-medium text-zinc-950 underline">Sign in</Link>
          </p>
        </form>
      </div>
    </main>
  )
}
