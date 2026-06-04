'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { getNotificationMeta, NOTIFICATION_TYPE_META } from '@/lib/constants'
import { relativeTime } from '@/lib/utils/dates'
import type { Notification } from '@/lib/types'

type Filter = 'all' | 'unread'

interface Props {
  notifications: Notification[]
  total: number
  page: number
  totalPages: number
  filter: Filter
  type: string | null
  typeOptions: string[]
}

function formatTypeLabel(t: string): string {
  return t.charAt(0).toUpperCase() + t.slice(1)
}

export function NotificationsList({
  notifications,
  total,
  filter,
  type,
  typeOptions,
}: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [marking, setMarking] = useState(false)
  const [, startTransition] = useTransition()

  // Optimistic local read state — survives until refresh.
  const [readIds, setReadIds] = useState<Set<string>>(new Set())

  function isRead(n: Notification) {
    return n.is_read || readIds.has(n.id)
  }

  function buildHref(next: Partial<{ filter: Filter; type: string | null }>) {
    const params = new URLSearchParams()
    const f = next.filter ?? filter
    const t = 'type' in next ? next.type : type
    if (f !== 'all') params.set('filter', f)
    if (t) params.set('type', t)
    const qs = params.toString()
    return qs ? `/dashboard/notifications?${qs}` : '/dashboard/notifications'
  }

  async function markRead(id: string) {
    if (busy) return
    setBusy(id)
    setReadIds((prev) => new Set(prev).add(id))
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ is_read: true }),
      })
      if (!res.ok) throw new Error()
    } catch {
      // rollback on failure
      setReadIds((prev) => {
        const cp = new Set(prev)
        cp.delete(id)
        return cp
      })
      toast.error('Could not mark as read')
    } finally {
      setBusy(null)
    }
  }

  async function markAllRead() {
    if (marking) return
    setMarking(true)
    try {
      const res = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      })
      if (!res.ok) throw new Error()
      toast.success('All notifications marked as read.')
      startTransition(() => router.refresh())
    } catch {
      toast.error('Failed to mark all as read.')
    } finally {
      setMarking(false)
    }
  }

  function handleRowClick(n: Notification) {
    if (!isRead(n)) markRead(n.id)
    if (n.link) {
      startTransition(() => router.push(n.link!))
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        <div className="flex flex-wrap items-center gap-1">
          <FilterPill href={buildHref({ filter: 'all' })} active={filter === 'all'}>
            All
          </FilterPill>
          <FilterPill
            href={buildHref({ filter: 'unread' })}
            active={filter === 'unread'}
          >
            Unread
          </FilterPill>

          <div className="relative">
            <select
              value={type ?? 'all'}
              onChange={(e) => {
                const v = e.target.value
                router.push(buildHref({ type: v === 'all' ? null : v }))
              }}
              className="app-input h-9 appearance-none rounded-md pl-3 pr-8 text-sm"
            >
              <option value="all">All types</option>
              {typeOptions.map((t) => (
                <option key={t} value={t}>
                  {formatTypeLabel(t)}
                </option>
              ))}
            </select>
            <ChevronDown className="app-subtle pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" />
          </div>
        </div>

        <button
          onClick={markAllRead}
          disabled={marking || total === 0}
          className="app-nav-item inline-flex h-9 items-center gap-1.5 rounded-md border border-zinc-200 px-3 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:text-zinc-400"
        >
          <Check className="h-3.5 w-3.5" />
          {marking ? 'Marking…' : 'Mark all as read'}
        </button>
      </div>

      {/* List */}
      {notifications.length > 0 && (
        <ul className="app-muted-panel overflow-hidden rounded-lg">
          {notifications.map((n) => {
            const read = isRead(n)
            const meta =
              getNotificationMeta(n.type) ?? NOTIFICATION_TYPE_META.default
            const Icon = meta.icon
            return (
              <li key={n.id}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => handleRowClick(n)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleRowClick(n)
                    }
                  }}
                  className={cn(
                    'group flex cursor-pointer items-start gap-4 border-b border-zinc-100 px-4 py-4 transition-colors last:border-b-0',
                    !read && 'bg-violet-50/60',
                    'hover:bg-zinc-50'
                  )}
                >
                  <div
                    className={cn(
                      'app-icon-surface mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="app-heading truncate text-sm font-medium">
                            {n.title}
                          </p>
                          {!read && (
                            <span
                              aria-label="unread"
                              className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-violet-600"
                            />
                          )}
                        </div>
                        {n.body && (
                          <p className="app-subtle mt-0.5 line-clamp-2 text-sm">
                            {n.body}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="app-subtle whitespace-nowrap text-xs tabular-nums">
                          {relativeTime(n.created_at)}
                        </span>
                      </div>
                    </div>

                    {!read && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          markRead(n.id)
                        }}
                        disabled={busy === n.id}
                        className="app-accent mt-2 inline-flex items-center gap-1 text-[11px] font-medium hover:underline disabled:opacity-50"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function FilterPill({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex h-9 items-center border-b-2 px-3 text-sm font-medium transition-colors',
        active
          ? 'border-violet-600 text-violet-700'
          : 'border-transparent text-zinc-500 hover:text-zinc-900'
      )}
    >
      {children}
    </Link>
  )
}
