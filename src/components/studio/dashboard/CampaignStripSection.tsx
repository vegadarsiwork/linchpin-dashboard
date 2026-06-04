import { createAdminClient } from '@/lib/db/client'
import { CampaignCard } from '@/components/studio/CampaignCard'
import { EmptyState } from '@/components/studio/EmptyState'
import type { Campaign } from '@/lib/types'

export async function CampaignStripSection({ orgId }: { orgId: string }) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('campaigns')
    .select('*')
    .eq('org_id', orgId)
    .eq('status', 'active')
    .order('started_at', { ascending: false })

  const items = (data ?? []) as Campaign[]

  return (
    <section>
      <h2 className="mb-3 text-base font-semibold text-zinc-900">
        Active campaigns
      </h2>

      {items.length === 0 ? (
        <EmptyState
          iconKey="megaphone"
          title="No active campaigns right now."
          description="Active campaigns from your Studio team will appear here."
        />
      ) : (
        <div className="-mx-4 sm:-mx-6 lg:-mx-8">
          <div className="flex gap-4 overflow-x-auto px-4 sm:px-6 lg:px-8 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {items.map((c) => (
              <CampaignCard key={c.id} campaign={c} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
