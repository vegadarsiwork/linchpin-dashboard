'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Video,
  Film,
  FileText,
  Users,
  Send,
  MessageCircle,
  Sparkles,
  CreditCard,
  Settings,
  LogOut,
  Mail,
  Menu,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Organisation, User } from '@/lib/types'
import { NavItem, type NavItemProps } from './NavItem'

export interface SidebarProps {
  user: User
  org: Organisation | null
  zapBadge: number
  reelsBadge: number
}

function buildNav(
  activeModules: string[],
  zapBadge: number,
  reelsBadge: number
): NavItemProps[] {
  return [
    {
      href: '/dashboard',
      label: 'Command Center',
      icon: LayoutDashboard,
      activeModules,
      exact: true,
    },
    {
      href: '/dashboard/reels',
      label: 'Reels',
      icon: Video,
      module: 'content',
      activeModules,
      badge: reelsBadge > 0 ? { count: reelsBadge, tone: 'amber' } : undefined,
    },
    {
      href: '/dashboard/scripts',
      label: 'Scripts',
      icon: FileText,
      activeModules,
    },
    {
      href: '/dashboard/clips',
      label: 'Clips',
      icon: Film,
      activeModules,
    },
    {
      href: '/dashboard/leads',
      label: 'Leads',
      icon: Users,
      module: 'leads',
      activeModules,
    },
    {
      href: '/dashboard/influencers',
      label: 'Influencers',
      icon: Sparkles,
      activeModules,
    },
    {
      href: '/dashboard/outreach',
      label: 'Outreach',
      icon: Send,
      module: 'outreach',
      activeModules,
    },
    {
      href: '/dashboard/zap',
      label: 'Zap — WhatsApp',
      icon: MessageCircle,
      module: 'zap',
      activeModules,
      badge: zapBadge > 0 ? { count: zapBadge, tone: 'red' } : undefined,
    },
    {
      href: '/dashboard/billing',
      label: 'Billing',
      icon: CreditCard,
      activeModules,
    },
    {
      href: '/dashboard/settings',
      label: 'Settings',
      icon: Settings,
      activeModules,
    },
  ]
}

function initials(name: string | null, email: string): string {
  const src = (name?.trim() || email).trim()
  const parts = src.split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return src.slice(0, 2).toUpperCase()
}

function AccountManagerCard({ org }: { org: Organisation | null }) {
  const name = org?.account_manager_name
  const email = org?.account_manager_email
  const phone = org?.account_manager_phone
  const avatar = org?.account_manager_avatar_url

  if (!name) {
    return (
      <div className="app-muted-panel rounded-lg p-3">
        <div className="app-subtle text-[11px] font-medium uppercase tracking-wide">
          Support
        </div>
        <div className="app-heading mt-1 text-sm font-medium">
          Linchpin Studio Team
        </div>
        <a
          href="mailto:hello@linchpinsoftsolution.com"
          className="app-accent mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium hover:underline"
        >
          <Mail className="h-3 w-3" /> Contact support
        </a>
      </div>
    )
  }

  const waPhone = phone ? phone.replace(/[^\d]/g, '') : null
  const waNumber = waPhone ? (waPhone.startsWith('91') ? waPhone : '91' + waPhone) : null

  return (
    <div className="app-muted-panel rounded-lg p-3">
      <div className="flex items-center gap-2.5">
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatar}
            alt={name}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="app-icon-surface flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold">
            {initials(name, email || '')}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="app-heading truncate text-sm font-medium">
            {name}
          </div>
          <div className="app-subtle text-[11px]">Account Manager</div>
        </div>
      </div>
      <div className="mt-2.5 flex gap-1.5">
        {waNumber && (
          <a
            href={`https://wa.me/${waNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            title="WhatsApp"
            className="inline-flex h-7 flex-1 items-center justify-center gap-1 rounded-md bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 transition-colors hover:bg-emerald-100"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span className="text-[11px] font-medium">WhatsApp</span>
          </a>
        )}
        {email && (
          <a
            href={`mailto:${email}`}
            title="Email"
            className="inline-flex h-7 flex-1 items-center justify-center gap-1 rounded-md bg-zinc-50 text-zinc-700 ring-1 ring-zinc-200 transition-colors hover:bg-zinc-100"
          >
            <Mail className="h-3.5 w-3.5" />
            <span className="text-[11px] font-medium">Email</span>
          </a>
        )}
      </div>
    </div>
  )
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
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-600 text-xs font-semibold text-white">
          {initials(user.full_name, user.email)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="app-heading truncate text-sm font-medium">
            {user.full_name || 'You'}
          </div>
          <div className="app-subtle truncate text-[11px]">
            {user.email}
          </div>
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

function SidebarBody({ user, org, zapBadge, reelsBadge }: SidebarProps) {
  const activeModules = org?.active_modules ?? []
  const nav = buildNav(activeModules, zapBadge, reelsBadge)

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pb-5 pt-5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="app-sidebar-brand flex h-9 w-9 items-center justify-center rounded-lg text-base font-bold shadow-sm">
            L
          </div>
          <div className="min-w-0">
            <span className="app-heading block truncate text-[15px] font-semibold tracking-tight">
              Linchpin Studio
            </span>
            <span className="app-accent block text-[11px] font-medium">
              Client Command
            </span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {nav.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}
      </nav>

      <div className="space-y-2 p-3">
        <AccountManagerCard org={org} />
        <div className="my-1 h-px bg-zinc-200" />
        <UserSection user={user} />
      </div>
    </div>
  )
}

export function Sidebar(props: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-3 top-3 z-30 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white shadow-sm md:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5 text-zinc-700" />
      </button>

      {/* Desktop sidebar */}
      <aside className="dashboard-desktop-sidebar app-sidebar fixed inset-y-0 left-0 z-20 w-[264px] border-r">
        <SidebarBody {...props} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className={cn(
              'app-sidebar absolute inset-y-0 left-0 w-[280px] border-r shadow-xl'
            )}
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarBody {...props} />
          </aside>
        </div>
      )}
    </>
  )
}
