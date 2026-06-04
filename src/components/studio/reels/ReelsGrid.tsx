'use client'

import { useMemo, useState } from 'react'
import { ReelGridCard } from './ReelGridCard'
import { ReelDetailModal } from './ReelDetailModal'
import {
  ReelFilterTabs,
  type ReelStatusFilter,
} from './ReelFilterTabs'
import { EmptyState } from '@/components/studio/EmptyState'
import type { ContentItem } from '@/lib/types'

export type ReelsGridProps = {
  initial: ContentItem[]
  isAdmin?: boolean
}

export function ReelsGrid({ initial, isAdmin }: ReelsGridProps) {
  const [items, setItems] = useState<ContentItem[]>(initial)
  const [filter, setFilter] = useState<ReelStatusFilter>('all')
  const [openItem, setOpenItem] = useState<ContentItem | null>(null)

  const counts = useMemo(() => {
    const c: Partial<Record<ReelStatusFilter, number>> = { all: items.length }
    for (const i of items) {
      const s = i.status as ReelStatusFilter
      c[s] = (c[s] ?? 0) + 1
    }
    return c
  }, [items])

  const filtered = useMemo(() => {
    if (filter === 'all') return items
    return items.filter((i) => i.status === filter)
  }, [items, filter])

  function handleResolved(id: string, nextStatus: string) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: nextStatus } : i))
    )
  }

  return (
    <div className="space-y-5">
      <ReelFilterTabs value={filter} onChange={setFilter} counts={counts} />

      {filtered.length === 0 ? (
        <EmptyState
          iconKey="fileVideo"
          title="No reels here"
          description={
            filter === 'pending_approval'
              ? 'Nothing waiting for your approval right now.'
              : 'Your Studio team will publish reels here.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <ReelGridCard
              key={item.id}
              item={item}
              onOpen={setOpenItem}
              onResolved={handleResolved}
            />
          ))}
        </div>
      )}

      <ReelDetailModal
        item={openItem}
        onClose={() => setOpenItem(null)}
        onResolved={handleResolved}
        isAdmin={isAdmin}
      />
    </div>
  )
}
