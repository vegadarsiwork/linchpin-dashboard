import { createAdminClient } from '@/lib/db/client'
import { PendingReels } from './PendingReels'
import type { ContentItem } from '@/lib/types'

export async function PendingReelsSection({ orgId }: { orgId: string }) {
  const supabase = createAdminClient()

  const [{ data: items }, { count }] = await Promise.all([
    supabase
      .from('content_items')
      .select('*')
      .eq('org_id', orgId)
      .eq('status', 'pending_approval')
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('content_items')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('status', 'pending_approval'),
  ])

  if (!items || items.length === 0) return null

  return (
    <PendingReels
      initial={items as ContentItem[]}
      totalCount={count ?? items.length}
    />
  )
}
