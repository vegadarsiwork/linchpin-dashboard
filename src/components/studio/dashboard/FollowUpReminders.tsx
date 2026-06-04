'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Clock, Loader2, Mail, Phone } from 'lucide-react'
import { toast } from 'sonner'
import { Button, buttonVariants } from '@/components/ui/button'
import { StatusBadge } from '@/components/studio/StatusBadge'
import { relativeTime } from '@/lib/utils/dates'
import type { Lead } from '@/lib/types'

export type FollowUpRemindersProps = {
  initial: Lead[]
}

export function FollowUpReminders({ initial }: FollowUpRemindersProps) {
  const [items, setItems] = useState(initial)
  const [pendingId, setPendingId] = useState<string | null>(null)

  async function markDone(lead: Lead) {
    const id = lead.id
    setPendingId(id)
    const prev = items
    setItems((curr) => curr.filter((l) => l.id !== id))
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ follow_up_at: null, follow_up_note: null }),
      })
      if (!res.ok) throw new Error('failed')
      toast.success('Marked done')
    } catch {
      setItems(prev)
      toast.error('Could not mark done. Try again.')
    } finally {
      setPendingId(null)
    }
  }

  if (items.length === 0) return null

  return (
    <section className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
      <div className="mb-3 flex items-center gap-2 text-amber-900">
        <Clock className="h-4 w-4" />
        <p className="text-sm font-semibold">
          Follow-up reminders due ({items.length})
        </p>
      </div>

      <div className="space-y-2">
        {items.map((lead) => (
          <div
            key={lead.id}
            className="flex flex-col gap-2 rounded-md bg-white px-3 py-2.5 sm:flex-row sm:items-center sm:gap-3"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-zinc-900 truncate">
                  {lead.name ?? 'Unnamed lead'}
                </p>
                <StatusBadge status={lead.status} variant="lead" />
                <span className="text-xs text-zinc-400 tabular-nums">
                  {relativeTime(lead.follow_up_at)}
                </span>
              </div>
              {lead.follow_up_note && (
                <p className="mt-0.5 text-xs text-zinc-600 line-clamp-1">
                  {lead.follow_up_note}
                </p>
              )}
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                {lead.phone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {lead.phone}
                  </span>
                )}
                {lead.email && (
                  <span className="inline-flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {lead.email}
                  </span>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => markDone(lead)}
                disabled={pendingId === lead.id}
              >
                {pendingId === lead.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : null}
                Mark done
              </Button>
              <Link
                href={`/dashboard/leads?lead=${lead.id}`}
                className={buttonVariants({ variant: 'ghost', size: 'sm' })}
              >
                View lead
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
