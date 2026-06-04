'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Bell, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Notification, Organisation, User } from '@/lib/types'

export interface TopbarProps {
  user: User
  org: Organisation | null
  initialNotifications: Notification[]
  initialUnreadCount: number
}

function greetingFor(hour: number): string {
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function firstName(user: User): string {
  if (user.full_name) return user.full_name.split(/\s+/)[0]
  return user.email.split('@')[0]
}

function planStyles(plan: string | null | undefined) {
  switch ((plan || '').toLowerCase()) {
    case 'system':
      return { bg: 'bg-violet-50', text: 'app-accent', label: 'System' }
    case 'scale':
      return { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Scale' }
    case 'spark':
      return { bg: 'bg-zinc-100', text: 'text-zinc-700', label: 'Spark' }
    default:
      return {
        bg: 'bg-zinc-100',
        text: 'text-zinc-700',
        label: plan ? plan[0].toUpperCase() + plan.slice(1) : 'Free',
      }
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d`
  return new Date(iso).toLocaleDateString()
}

function NotificationItem({ n }: { n: Notification }) {
  const inner = (
    <div
      className={cn(
        'group flex gap-3 px-4 py-3 transition-colors hover:bg-zinc-50',
        !n.is_read && 'bg-violet-50/70'
      )}
    >
      <div
        className={cn(
          'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full',
          n.is_read ? 'bg-transparent' : 'bg-violet-600'
        )}
      />
      <div className="min-w-0 flex-1">
        <div className="app-heading text-sm font-medium">{n.title}</div>
        {n.body && (
          <div className="app-subtle mt-0.5 line-clamp-2 text-xs">
            {n.body}
          </div>
        )}
        <div className="app-muted mt-1 text-[11px]">
          {timeAgo(n.created_at)}
        </div>
      </div>
    </div>
  )
  return n.link ? <Link href={n.link}>{inner}</Link> : inner
}

export function Topbar({
  user,
  org,
  initialNotifications,
  initialUnreadCount,
}: TopbarProps) {
  const [hour, setHour] = useState<number>(() => new Date().getHours())
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications)
  const [unread, setUnread] = useState<number>(initialUnreadCount)
  const [marking, setMarking] = useState(false)

  useEffect(() => {
    const id = setInterval(() => setHour(new Date().getHours()), 60_000)
    return () => clearInterval(id)
  }, [])

  const greeting = useMemo(() => greetingFor(hour), [hour])
  const plan = planStyles(org?.plan)

  async function markAllRead() {
    if (marking || unread === 0) return
    setMarking(true)
    const prevNotifications = notifications
    const prevUnread = unread
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnread(0)
    try {
      const res = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      })
      if (!res.ok) throw new Error('failed')
    } catch {
      setNotifications(prevNotifications)
      setUnread(prevUnread)
    } finally {
      setMarking(false)
    }
  }

  return (
    <header className="app-topbar sticky top-0 z-10 flex h-16 items-center justify-between border-b px-4 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-2 pl-12 md:pl-0">
        <h1 className="app-heading truncate text-[15px] font-medium">
          {greeting}, {firstName(user)}
        </h1>
        {org?.name && (
          <span className="app-subtle hidden text-[12px] font-medium sm:inline">
            {org.name}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className="app-subtle relative inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            aria-label="Notifications"
          >
            <Bell className="h-4.5 w-4.5" strokeWidth={2} />
            {unread > 0 && (
              <span className="absolute right-1.5 top-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-violet-600 px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-white">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </button>

          {open && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setOpen(false)}
                aria-hidden
              />
              <div className="app-panel absolute right-0 top-full z-50 mt-2 w-[360px] overflow-hidden rounded-xl shadow-lg">
                <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
                  <span className="app-heading text-sm font-semibold">
                    Notifications
                  </span>
                  <button
                    onClick={markAllRead}
                    disabled={marking || unread === 0}
                    className="app-accent inline-flex items-center gap-1 text-xs font-medium hover:underline disabled:cursor-not-allowed disabled:text-zinc-400 disabled:no-underline"
                  >
                    <Check className="h-3 w-3" /> Mark all read
                  </button>
                </div>

                <div className="max-h-[420px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-10 text-center text-sm text-zinc-500">
                      You&apos;re all caught up
                    </div>
                  ) : (
                    notifications
                      .slice(0, 8)
                      .map((n) => <NotificationItem key={n.id} n={n} />)
                  )}
                </div>

                {notifications.length > 0 && (
                  <Link
                    href="/dashboard/notifications"
                    className="app-accent block border-t border-zinc-200 px-4 py-2.5 text-center text-xs font-medium hover:bg-zinc-50"
                    onClick={() => setOpen(false)}
                  >
                    View all
                  </Link>
                )}
              </div>
            </>
          )}
        </div>

        <span
          className={cn(
            'inline-flex h-7 items-center text-[11px] font-semibold uppercase tracking-wide',
            plan.bg,
            plan.text,
            'rounded-full px-2.5'
          )}
        >
          {plan.label}
        </span>
      </div>
    </header>
  )
}
