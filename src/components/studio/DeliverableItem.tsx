'use client'

import { cn } from '@/lib/utils'
import { DELIVERABLE_STATUS_DOT } from '@/lib/constants'
import { dueState } from '@/lib/utils/dates'
import type { Deliverable } from '@/lib/types'

export type DeliverableItemProps = {
  deliverable: Deliverable
}

export function DeliverableItem({ deliverable }: DeliverableItemProps) {
  const statusMeta =
    DELIVERABLE_STATUS_DOT[deliverable.status] ??
    DELIVERABLE_STATUS_DOT.upcoming
  const due = dueState(deliverable.due_date)

  const dueClass =
    due?.urgency === 'overdue' || due?.urgency === 'today'
      ? 'font-semibold text-red-600'
      : due?.urgency === 'soon'
        ? 'font-medium text-amber-600'
        : 'text-zinc-500'

  return (
    <div className="app-muted-panel group flex items-start gap-3 rounded-lg px-4 py-3 transition-colors hover:border-violet-200">
      <span className="mt-2 inline-flex h-2.5 w-2.5 shrink-0 items-center justify-center">
        <span
          className={cn(
            'h-2 w-2 rounded-full',
            statusMeta.dot,
            statusMeta.pulse && 'animate-pulse'
          )}
        />
      </span>

      <div className="min-w-0 flex-1">
        <div className="app-subtle mb-1 text-xs">{statusMeta.label}</div>

        <p className="app-heading truncate text-sm font-medium">
          {deliverable.title}
        </p>
        {deliverable.description && (
          <p className="app-subtle mt-0.5 line-clamp-2 text-sm">
            {deliverable.description}
          </p>
        )}
      </div>

      {due && (
        <span className={cn('shrink-0 text-xs tabular-nums', dueClass)}>
          {due.label}
        </span>
      )}
    </div>
  )
}
