'use client'

import { cn } from '@/lib/utils'

export type ReelStatusFilter =
  | 'all'
  | 'pending_approval'
  | 'correction_requested'
  | 'correction_submitted'
  | 'final_approved'
  | 'approved'
  | 'published'
  | 'rejected'

export const REEL_FILTER_OPTIONS: {
  value: ReelStatusFilter
  label: string
}[] = [
  { value: 'all',                  label: 'All' },
  { value: 'pending_approval',     label: 'Pending approval' },
  { value: 'correction_requested', label: 'Corrections requested' },
  { value: 'correction_submitted', label: 'Revised' },
  { value: 'final_approved',       label: 'Final approved' },
  { value: 'approved',             label: 'Approved' },
  { value: 'published',            label: 'Published' },
  { value: 'rejected',             label: 'Rejected' },
]

export type ReelFilterTabsProps = {
  value: ReelStatusFilter
  onChange: (next: ReelStatusFilter) => void
  counts?: Partial<Record<ReelStatusFilter, number>>
}

export function ReelFilterTabs({ value, onChange, counts }: ReelFilterTabsProps) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-zinc-200 pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {REEL_FILTER_OPTIONS.map((opt) => {
        const active = value === opt.value
        const c = counts?.[opt.value]
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'border-violet-600 text-violet-700'
                : 'border-transparent text-zinc-500 hover:text-zinc-900'
            )}
          >
            {opt.label}
            {c !== undefined && c > 0 && (
              <span
                className={cn(
                  'inline-flex min-w-[18px] items-center justify-center px-1 text-[10px] font-semibold tabular-nums',
                  active
                    ? 'text-violet-700'
                    : 'text-zinc-500'
                )}
              >
                {c}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
