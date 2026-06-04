'use client'

import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils/dates'
import { Clock, Calendar, Tag } from 'lucide-react'
import type { ClipWithRelations } from '@/lib/types'

const STATUS_STYLES: Record<string, { text: string; dot: string; label: string }> = {
  pending:            { text: 'text-zinc-500',   dot: 'bg-zinc-400',    label: 'Pending review' },
  partially_reviewed: { text: 'text-amber-700',  dot: 'bg-amber-500',   label: 'In review' },
  approved:           { text: 'text-emerald-700',dot: 'bg-emerald-500', label: 'Approved' },
  changes_requested:  { text: 'text-red-700',    dot: 'bg-red-500',     label: 'Changes requested' },
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

export type ClipCardProps = {
  clip: ClipWithRelations
  onClick: (clip: ClipWithRelations) => void
}

export function ClipCard({ clip, onClick }: ClipCardProps) {
  const style = STATUS_STYLES[clip.status] ?? STATUS_STYLES.pending
  const reviewable =
    clip.status === 'pending' || clip.status === 'partially_reviewed'

  return (
    <div
      onClick={() => onClick(clip)}
      className={cn(
        'app-muted-panel group flex cursor-pointer flex-col overflow-hidden rounded-lg transition-colors hover:border-violet-200',
        clip.status === 'approved' && 'border-emerald-200'
      )}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-zinc-100">
        {clip.preview_url ? (
          <video
            src={clip.preview_url}
            className="h-full w-full object-cover"
            preload="metadata"
            muted
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="app-subtle text-xs">No preview</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {clip.campaign_name && (
          <div className="flex items-center gap-1">
            <Tag className="h-3 w-3 text-violet-500 shrink-0" />
            <span className="truncate text-[11px] font-medium text-violet-600">
              {clip.campaign_name}
            </span>
          </div>
        )}

        <p className="app-heading line-clamp-2 text-sm font-semibold">
          {clip.title}
        </p>

        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={cn('h-1.5 w-1.5 rounded-full', style.dot)} />
          <span className={cn('text-[11px] font-medium', style.text)}>
            {style.label}
          </span>
        </div>

        <div className="mt-auto flex flex-wrap gap-x-3 gap-y-1 pt-1">
          <span className="app-subtle inline-flex items-center gap-1 text-[11px]">
            <Clock className="h-3 w-3" />
            {formatDuration(clip.duration_seconds)}
          </span>
          <span className="app-subtle inline-flex items-center gap-1 text-[11px]">
            <Calendar className="h-3 w-3" />
            {formatDate(clip.created_at)}
          </span>
        </div>

        {reviewable && (
          <div className="mt-2 rounded-md bg-violet-50 px-2.5 py-1.5 text-center text-[11px] font-medium text-violet-700">
            Click to review
          </div>
        )}
      </div>
    </div>
  )
}
