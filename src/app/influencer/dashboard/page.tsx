import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { queryOne, query } from '@/lib/db'
import { InfluencerDashboardClient } from '@/components/influencer/InfluencerDashboardClient'
import { InfluencerShell } from '@/components/influencer/InfluencerShell'
import type { Influencer, InfluencerReel } from '@/lib/types'

export const dynamic = 'force-dynamic'

type CreatorRequest = {
  id: string
  status: string
  request_source: string
  brief: Record<string, unknown>
  client_notes: string | null
  admin_notes: string | null
  created_at: string
  org_name: string | null
}

export default async function InfluencerDashboardPage() {
  const me = await getCurrentUser()
  if (!me) redirect('/influencer/login')
  if (me.user.role !== 'influencer') redirect('/dashboard')

  const influencer = await queryOne<Influencer>('select * from influencers where user_id = $1', [me.user.id])
  if (!influencer) redirect('/influencer/signup')

  const [reels, requests] = await Promise.all([
    query<InfluencerReel>(
      `select * from influencer_reels where influencer_id = $1 order by is_featured desc, created_at desc`,
      [influencer.id]
    ),
    query<CreatorRequest>(
      `select imr.id, imr.status, imr.request_source, imr.brief, imr.client_notes,
              imr.admin_notes, imr.created_at, o.name as org_name
       from influencer_match_requests imr
       left join organisations o on o.id = imr.org_id
       where coalesce(imr.requested_influencer_id, imr.selected_influencer_id) = $1
       order by imr.created_at desc
       limit 40`,
      [influencer.id]
    ),
  ])

  return (
    <InfluencerShell user={me.user}>
      <InfluencerDashboardClient influencer={influencer} reels={reels} requests={requests} />
    </InfluencerShell>
  )
}
