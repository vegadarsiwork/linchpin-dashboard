'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { getActivityMeta } from '@/lib/constants'
import { relativeTime } from '@/lib/utils/dates'
import type { Activity } from '@/lib/types'

export type ActivityFeedItemProps = {
  activity: Activity
}

export function ActivityFeedItem({ activity }: ActivityFeedItemProps) {
  const { icon: Icon } = getActivityMeta(activity.type)
  const time = relativeTime(activity.created_at)

  const body = (
    <div
      className={cn(
        'group flex items-start gap-3 border-b border-zinc-100 px-3 py-3.5 transition-colors last:border-b-0 sm:px-4',
        activity.link && 'cursor-pointer hover:bg-zinc-50'
      )}
    >
      <div className="app-icon-surface flex h-8 w-8 shrink-0 items-center justify-center">
        <Icon className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <p className="app-heading truncate text-sm font-medium">
            {activity.title}
          </p>
          <span className="app-subtle shrink-0 text-xs tabular-nums">
            {time}
          </span>
        </div>
        {activity.description && (
          <p className="app-subtle mt-0.5 truncate text-sm">
            {activity.description}
          </p>
        )}
      </div>

      {!activity.is_read && (
        <span
          aria-label="unread"
          className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-violet-600"
        />
      )}
    </div>
  )

  return activity.link ? (
    <Link href={activity.link} className="block">
      {body}
    </Link>
  ) : (
    body
  )
}
