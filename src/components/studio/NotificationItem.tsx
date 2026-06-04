'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { cn } from '@/lib/utils'
import { getNotificationMeta } from '@/lib/constants'
import { relativeTime } from '@/lib/utils/dates'
import type { Notification } from '@/lib/types'

export type NotificationItemProps = {
  notification: Notification
  onMarkRead?: (id: string) => void
}

export function NotificationItem({
  notification,
  onMarkRead,
}: NotificationItemProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const meta = getNotificationMeta(notification.type)
  const Icon = meta.icon
  const time = relativeTime(notification.created_at)

  async function handleClick() {
    if (!notification.is_read) {
      // Best-effort mark-as-read; ignore errors silently.
      void fetch(`/api/notifications/${notification.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_read: true }),
      })
      onMarkRead?.(notification.id)
    }
    if (notification.link) {
      startTransition(() => router.push(notification.link!))
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'group w-full text-left flex items-start gap-3 px-4 py-3 transition-colors',
        'hover:bg-zinc-50',
        !notification.is_read && 'bg-violet-50/40'
      )}
    >
      <div
        className={cn(
          'h-8 w-8 shrink-0 rounded-md flex items-center justify-center',
          meta.bg
        )}
      >
        <Icon className={cn('h-4 w-4', meta.text)} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <p className="app-heading truncate text-sm font-medium">
            {notification.title}
          </p>
          <span className="app-subtle shrink-0 text-xs tabular-nums">
            {time}
          </span>
        </div>
        {notification.body && (
          <p className="app-subtle mt-0.5 line-clamp-2 text-sm">
            {notification.body}
          </p>
        )}
      </div>

      {!notification.is_read && (
        <span
          aria-label="unread"
          className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-violet-600"
        />
      )}
    </button>
  )
}
