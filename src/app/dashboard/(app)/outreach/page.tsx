import { redirect } from 'next/navigation'
import { Activity, CalendarDays } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/db/client'
import { PageHeader } from '@/components/studio'

export const dynamic = 'force-dynamic'

type CampaignRow = {
  id: string
  name: string
  type: string
  status: string
  stats: Record<string, unknown> | null
  started_at: string | null
}

function label(value: string) {
  return value.replaceAll('_', ' ')
}

function statPairs(campaign: CampaignRow) {
  const stats = campaign.stats ?? {}
  const preferred =
    campaign.type === 'cold_email'
      ? ['open_rate', 'reply_rate', 'meetings_booked']
      : campaign.type === 'linkedin'
        ? ['connections_sent', 'accepted_rate', 'reply_rate']
        : campaign.type === 'meta_ads'
          ? ['spend_inr', 'leads', 'roas']
          : campaign.type === 'google_ads'
            ? ['clicks', 'conversions', 'cost_per_lead_inr']
            : ['sent', 'read_rate', 'replies']

  return preferred
    .filter((key) => stats[key] !== undefined && stats[key] !== null)
    .map((key) => [key, String(stats[key])])
}

export default async function OutreachPage() {
  const me = await getCurrentUser()
  if (!me) redirect('/dashboard/login')
  if (!me.org) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center text-sm text-zinc-500">
        Your account is not linked to an organisation yet.
      </div>
    )
  }

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('campaigns')
    .select('id,name,type,status,stats,started_at')
    .eq('org_id', me.org.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const campaigns = (data ?? []) as CampaignRow[]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Outreach"
        description="Track active campaigns, channel performance, and what your Studio team is running."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {campaigns.map((campaign) => (
          <article
            key={campaign.id}
            className="app-panel rounded-lg p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="app-heading truncate text-sm font-semibold">
                  {campaign.name}
                </h2>
                <p className="app-subtle mt-1 text-xs capitalize">
                  {label(campaign.type)}
                </p>
              </div>
              <span className="app-soft-panel rounded-md px-2 py-1 text-[11px] font-semibold capitalize">
                {label(campaign.status)}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {statPairs(campaign).map(([key, value]) => (
                <div key={key} className="app-soft-panel rounded-md p-2">
                  <div className="app-subtle truncate text-[10px] uppercase tracking-wide">
                    {label(key)}
                  </div>
                  <div className="app-heading mt-1 text-sm font-semibold">
                    {value}
                  </div>
                </div>
              ))}
              {statPairs(campaign).length === 0 && (
                <div className="app-soft-panel app-subtle col-span-3 rounded-md p-3 text-xs">
                  Campaign stats will appear once your Studio team updates them.
                </div>
              )}
            </div>

            {campaign.started_at && (
              <div className="app-subtle mt-4 flex items-center gap-1.5 text-xs">
                <CalendarDays className="h-3.5 w-3.5" />
                Started {new Date(campaign.started_at).toLocaleDateString('en-IN')}
              </div>
            )}
          </article>
        ))}
      </div>

      {campaigns.length === 0 && (
        <div className="app-panel rounded-lg p-10 text-center">
          <Activity className="app-subtle mx-auto h-8 w-8" />
          <h2 className="app-heading mt-3 text-sm font-semibold">
            No outreach campaigns yet
          </h2>
          <p className="app-subtle mt-1 text-sm">
            Your Studio team will launch and report campaigns here.
          </p>
        </div>
      )}
    </div>
  )
}
