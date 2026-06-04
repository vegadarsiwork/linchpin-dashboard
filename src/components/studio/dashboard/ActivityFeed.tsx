'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { ActivityFeedItem } from '@/components/studio/ActivityFeedItem'
import { EmptyState } from '@/components/studio/EmptyState'
import { Button } from '@/components/ui/button'
import type { Activity } from '@/lib/types'

const PAGE_SIZE = 20

export type ActivityFeedProps = {
  initial: Activity[]
  orgId: string
}

export function ActivityFeed({ initial, orgId }: ActivityFeedProps) {
  const [items, setItems] = useState<Activity[]>(initial)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initial.length === PAGE_SIZE)
  const [marking, setMarking] = useState(false)

  const unreadCount = items.filter((i) => !i.is_read).length

  async function loadMore() {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        org_id: orgId,
        offset: String(items.length),
        limit: String(PAGE_SIZE),
      })
      const res = await fetch(`/api/activities?${params.toString()}`)
      if (!res.ok) throw new Error('failed')
      const data = (await res.json()) as { activities?: Activity[] }
      const next = data.activities ?? []
      setItems((prev) => [...prev, ...next])
      if (next.length < PAGE_SIZE) setHasMore(false)
    } catch {
      toast.error('Could not load more activity.')
    } finally {
      setLoading(false)
    }
  }

  async function markAllRead() {
    setMarking(true)
    const prev = items
    setItems((curr) => curr.map((a) => ({ ...a, is_read: true })))
    try {
      const res = await fetch('/api/activities/mark-all-read', { method: 'POST' })
      if (!res.ok) throw new Error('failed')
    } catch {
      setItems(prev)
      toast.error('Could not mark all read.')
    } finally {
      setMarking(false)
    }
  }

  if (items.length === 0) {
    return (
      <EmptyState
        iconKey="inbox"
        title="No activity yet"
        description="Your Studio team will get things moving soon."
      />
    )
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <h2 className="text-base font-semibold text-zinc-900">Recent activity</h2>
        {unreadCount > 0 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={markAllRead}
            disabled={marking}
            className="app-nav-item h-8 rounded-md px-2.5 text-xs sm:px-3 sm:text-sm"
          >
            {marking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Mark all as read
          </Button>
        )}
      </div>

      <div className="app-muted-panel overflow-hidden rounded-lg">
        {items.map((a) => (
          <div
            key={a.id}
            className={a.is_read ? '' : 'bg-violet-50/60'}
          >
            <ActivityFeedItem activity={a} />
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="mt-3 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : null}
            Load more
          </Button>
        </div>
      )}
    </div>
  )
}
