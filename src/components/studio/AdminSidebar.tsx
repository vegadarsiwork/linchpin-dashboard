'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Sparkles,
  FileText,
  ClipboardList,
  ShieldCheck,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { User } from '@/lib/types'
import { NavItem, type NavItemProps } from './NavItem'

const NAV: Omit<NavItemProps, 'activeModules'>[] = [
  { href: '/admin', label: 'All Clients', icon: LayoutDashboard, exact: true },
  { href: '/admin/influencers', label: 'Influencers', icon: Users },
  { href: '/admin/influencer-applications', label: 'Approvals', icon: ShieldCheck },
  { href: '/admin/influencer-requests', label: 'Requests', icon: ClipboardList },
  { href: '/admin/match', label: 'Match Creator', icon: Sparkles },
  { href: '/admin/scripts/new', label: 'Scripts', icon: FileText },
]

function initials(name: string | null, email: string): string {
  const src = (name?.trim() || email).trim()
  const parts = src.split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return src.slice(0, 2).toUpperCase()
}

function UserSection({ user }: { user: User }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [signing, setSigning] = useState(false)

  async function signOut() {
    if (signing) return
    setSigning(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/dashboard/login')
    router.refresh()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition-colors hover:bg-zinc-100"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
          {initials(user.full_name, user.email)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-zinc-900">
            {user.full_name || 'You'}
          </div>
          <div className="truncate text-[11px] text-zinc-500">{user.email}</div>
        </div>
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute bottom-full left-0 right-0 z-50 mb-1 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg">
            <button
              onClick={signOut}
              disabled={signing}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              {signing ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function SidebarBody({ user }: { user: User }) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pt-5 pb-4">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-base font-bold text-white shadow-sm">
            L
          </div>
          <div className="min-w-0">
            <div className="text-[15px] font-semibold leading-tight tracking-tight text-zinc-900">
              Linchpin Studio
            </div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-[#7C3AED]">
              Internal
            </div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 px-3" aria-label="Admin navigation">
        {NAV.map((item) => (
          <NavItem key={item.href} {...item} activeModules={[]} />
        ))}
      </nav>

      <div className="space-y-2 p-3">
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
          <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
            Mode
          </div>
          <div className="mt-0.5 text-sm font-semibold text-zinc-900">
            Superadmin
          </div>
          <Link
            href="/dashboard"
            className="mt-1.5 inline-block text-[11px] font-medium text-[#7C3AED] hover:underline"
          >
            ← Switch to client view
          </Link>
        </div>
        <div className="my-1 h-px bg-zinc-200" />
        <UserSection user={user} />
      </div>
    </div>
  )
}

export function AdminSidebar({ user }: { user: User }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-3 top-3 z-30 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white shadow-sm md:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5 text-zinc-700" />
      </button>

      <aside className="admin-desktop-sidebar fixed inset-y-0 left-0 z-20 w-[240px] border-r border-zinc-200 bg-white">
        <SidebarBody user={user} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className={cn(
              'absolute inset-y-0 left-0 w-[260px] border-r border-zinc-200 bg-white shadow-xl'
            )}
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarBody user={user} />
          </aside>
        </div>
      )}
    </>
  )
}
