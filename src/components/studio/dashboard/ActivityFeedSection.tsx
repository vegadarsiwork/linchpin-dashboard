import { createAdminClient } from '@/lib/db/client'
import { ActivityFeed } from './ActivityFeed'
import type { Activity } from '@/lib/types'

export async function ActivityFeedSection({ orgId }: { orgId: string }) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('activities')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(20)

  return <ActivityFeed initial={(data ?? []) as Activity[]} orgId={orgId} />
}

export function ActivityFeedSkeleton() {
  return (
    <div>
      <div className="h-5 w-32 mb-3 rounded bg-zinc-100 animate-pulse" />
      <div className="divide-y divide-zinc-100 rounded-lg border border-zinc-200/70 bg-white">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 p-4">
            <div className="h-8 w-8 shrink-0 rounded-md bg-zinc-100 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-48 rounded bg-zinc-100 animate-pulse" />
              <div className="h-3 w-3/4 rounded bg-zinc-100 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
