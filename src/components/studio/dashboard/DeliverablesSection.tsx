import { createAdminClient } from '@/lib/db/client'
import { DeliverableItem } from '@/components/studio/DeliverableItem'
import { EmptyState } from '@/components/studio/EmptyState'
import type { Deliverable } from '@/lib/types'

export async function DeliverablesSection({ orgId }: { orgId: string }) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('deliverables')
    .select('*')
    .eq('org_id', orgId)
    .neq('status', 'delivered')
    .order('due_date', { ascending: true, nullsFirst: false })
    .limit(5)

  const items = (data ?? []) as Deliverable[]

  return (
    <div>
      <h2 className="mb-3 text-base font-semibold text-zinc-900 px-1">
        Coming from your Studio team
      </h2>

      {items.length === 0 ? (
        <EmptyState
          iconKey="calendar"
          title="Nothing scheduled"
          description="Your Studio team is planning your next deliverables."
        />
      ) : (
        <div className="space-y-2">
          {items.map((d) => (
            <DeliverableItem key={d.id} deliverable={d} />
          ))}
        </div>
      )}
    </div>
  )
}

export function DeliverablesSkeleton() {
  return (
    <div>
      <div className="h-5 w-44 mb-3 rounded bg-zinc-100 animate-pulse" />
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-md border border-zinc-200/70 bg-white p-3"
          >
            <div className="h-2.5 w-2.5 rounded-full bg-zinc-100 mt-2 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-20 rounded bg-zinc-100 animate-pulse" />
              <div className="h-4 w-3/4 rounded bg-zinc-100 animate-pulse" />
              <div className="h-3 w-1/2 rounded bg-zinc-100 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
