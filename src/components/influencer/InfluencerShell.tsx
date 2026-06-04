'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import type { User } from '@/lib/types'

function initials(name: string | null, email: string) {
  const src = name?.trim() || email
  return src.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
}

export function InfluencerShell({ user, children }: { user: User; children: React.ReactNode }) {
  const router = useRouter()

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/influencer/login')
    router.refresh()
  }

  return (
    <div className="min-h-[100dvh] bg-[#f6f4ef] text-zinc-950">
      <header className="sticky top-0 z-20 border-b border-zinc-200/80 bg-[#fbfaf7]/92 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/influencer/dashboard" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-950 text-sm font-semibold text-white shadow-sm">L</div>
            <div>
              <div className="text-sm font-semibold leading-tight text-zinc-950">Creator Studio</div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Linchpin marketplace</div>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-medium text-zinc-950">{user.full_name || 'Creator'}</div>
              <div className="text-xs text-zinc-500">{user.email}</div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-xs font-semibold text-zinc-900 ring-1 ring-zinc-200">
              {initials(user.full_name, user.email)}
            </div>
            <button
              onClick={signOut}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 active:translate-y-px"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  )
}
