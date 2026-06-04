'use client'

import { useMemo, useState } from 'react'
import { ClipCard } from './ClipCard'
import { ClipReviewModal } from './ClipReviewModal'
import { EmptyState } from '@/components/studio/EmptyState'
import { cn } from '@/lib/utils'
import type { ClipWithRelations, ClipStatus } from '@/lib/types'

type StatusFilter = 'all' | ClipStatus

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'partially_reviewed', label: 'In review' },
  { value: 'approved', label: 'Approved' },
  { value: 'changes_requested', label: 'Changes requested' },
]

export type ClipsGridProps = {
  initial: ClipWithRelations[]
}

export function ClipsGrid({ initial }: ClipsGridProps) {
  const [clips, setClips] = useState<ClipWithRelations[]>(initial)
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [openClip, setOpenClip] = useState<ClipWithRelations | null>(null)

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = {
      all: clips.length,
      pending: 0,
      partially_reviewed: 0,
      approved: 0,
      changes_requested: 0,
    }
    for (const clip of clips) {
      if (clip.status in c) c[clip.status]++
    }
    return c
  }, [clips])

  const filtered = useMemo(() => {
    if (filter === 'all') return clips
    return clips.filter((c) => c.status === filter)
  }, [clips, filter])

  const grouped = useMemo(() => {
    const groups: { campaign: string | null; items: ClipWithRelations[] }[] = []
    const map = new Map<string, ClipWithRelations[]>()

    for (const clip of filtered) {
      const key = clip.campaign_name ?? '__none__'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(clip)
    }

    // Named campaigns first, then ungrouped
    for (const [key, items] of map) {
      if (key !== '__none__') {
        groups.push({ campaign: key, items })
      }
    }
    if (map.has('__none__')) {
      groups.push({ campaign: null, items: map.get('__none__')! })
    }

    return groups
  }, [filtered])

  function handleUpdated(id: string, updates: Partial<ClipWithRelations>) {
    setClips((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    )
    if (openClip?.id === id) {
      setOpenClip((prev) => (prev ? { ...prev, ...updates } : prev))
    }
  }

  return (
    <div className="space-y-5">
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => {
          const n = counts[f.value]
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium transition-colors',
                filter === f.value
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              )}
            >
              {f.label}
              {n > 0 && (
                <span
                  className={cn(
                    'inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-semibold',
                    filter === f.value ? 'bg-white/20 text-white' : 'bg-zinc-300 text-zinc-700'
                  )}
                >
                  {n}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {grouped.length === 0 ? (
        <EmptyState
          iconKey="fileVideo"
          title="No clips here"
          description={
            filter === 'pending'
              ? 'No clips waiting for your review.'
              : 'Clips uploaded by your Studio team will appear here.'
          }
        />
      ) : (
        <div className="space-y-8">
          {grouped.map((group) => (
            <section key={group.campaign ?? '__none__'}>
              {(grouped.length > 1 || group.campaign) && (
                <div className="mb-3 flex items-center gap-2">
                  <h3 className="app-heading text-sm font-semibold">
                    {group.campaign ?? 'Unassigned'}
                  </h3>
                  <span className="app-subtle text-[11px]">
                    ({group.items.length})
                  </span>
                </div>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((clip) => (
                  <ClipCard
                    key={clip.id}
                    clip={clip}
                    onClick={setOpenClip}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <ClipReviewModal
        clip={openClip}
        onClose={() => setOpenClip(null)}
        onUpdated={handleUpdated}
      />
    </div>
  )
}
