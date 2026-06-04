'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ReelCard } from './ReelCard'
import type { ContentItem } from '@/lib/types'

export type PendingReelsProps = {
  initial: ContentItem[]
  totalCount: number
}

export function PendingReels({ initial, totalCount }: PendingReelsProps) {
  const [items, setItems] = useState(initial)

  function handleResolved(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  if (items.length === 0) return null

  const moreCount = totalCount - items.length

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-zinc-900">
            Reels waiting for your approval
          </h2>
          <span className="inline-flex items-center rounded bg-violet-100 px-1.5 py-0.5 text-[11px] font-semibold text-violet-700 tabular-nums">
            {totalCount}
          </span>
        </div>
        {totalCount > items.length + 0 && moreCount > 0 && (
          <Link
            href="/dashboard/reels"
            className="inline-flex items-center gap-1 text-sm text-[#7C3AED] hover:underline"
          >
            View all {totalCount} pending <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <ReelCard key={item.id} item={item} onResolved={handleResolved} />
        ))}
      </div>
    </section>
  )
}
