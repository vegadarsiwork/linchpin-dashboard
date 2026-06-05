import {
  InfluencerApplicationsAdmin,
  type ProfileRow,
  type ReelRow,
} from '@/components/studio/influencers/InfluencerApplicationsAdmin'
import { requireSuperadmin } from '@/lib/auth'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function InfluencerApplicationsPage() {
  await requireSuperadmin()

  const [profiles, reels] = await Promise.all([
    query<ProfileRow>(
      `select
         i.id,
         i.display_name,
         i.name,
         i.city,
         i.niches,
         i.public_bio,
         i.approval_status,
         i.public_profile_completed,
         i.profile_submitted_at::text as profile_submitted_at,
         i.created_at::text as created_at,
         u.email as owner_email
       from influencers i
       left join users u on u.id = i.user_id
       where i.user_id is not null
       order by
         case i.approval_status when 'pending_review' then 0 when 'draft' then 1 else 2 end,
         i.created_at desc
       limit 80`
    ),
    query<ReelRow>(
      `select
         ir.id,
         ir.title,
         ir.gif_url,
         ir.video_url,
         ir.thumbnail_url,
         ir.approval_status,
         i.display_name,
         i.name
       from influencer_reels ir
       join influencers i on i.id = ir.influencer_id
       order by
         case ir.approval_status when 'pending_review' then 0 else 1 end,
         ir.created_at desc
       limit 120`
    ),
  ])

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Creator applications</h1>
        <p className="mt-1 text-sm text-zinc-500">Approve influencer-owned profiles and trial reel previews before clients can request them.</p>
      </div>
      <InfluencerApplicationsAdmin initialProfiles={profiles} initialReels={reels} />
    </div>
  )
}
