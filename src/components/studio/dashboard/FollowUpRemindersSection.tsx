import { createAdminClient } from '@/lib/db/client'
import { FollowUpReminders } from './FollowUpReminders'
import type { Lead } from '@/lib/types'

export async function FollowUpRemindersSection({ orgId }: { orgId: string }) {
  const supabase = createAdminClient()
  const nowIso = new Date().toISOString()

  const { data } = await supabase
    .from('leads')
    .select('*')
    .eq('org_id', orgId)
    .lte('follow_up_at', nowIso)
    .not('status', 'in', '("converted","lost")')
    .order('follow_up_at', { ascending: true })
    .limit(5)

  const leads = (data ?? []) as Lead[]
  if (leads.length === 0) return null

  return <FollowUpReminders initial={leads} />
}
