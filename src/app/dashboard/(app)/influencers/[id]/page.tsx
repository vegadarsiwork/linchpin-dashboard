import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { toPublicInfluencer } from '@/lib/influencers/public'
import type { Influencer, InfluencerReel } from '@/lib/types'
import { InfluencerProfilePageClient } from '@/components/studio/marketplace/InfluencerProfilePageClient'

export const dynamic = 'force-dynamic'

export default async function InfluencerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser()
  if (!me) redirect('/dashboard/login')

  const { id } = await params

  const row = await queryOne<Influencer & { featured_reel_url: string | null }>(
    `select i.*,
      (select coalesce(ir.gif_url, ir.video_url, ir.thumbnail_url)
       from influencer_reels ir
       where ir.influencer_id = i.id and ir.approval_status = 'approved'
       order by ir.is_featured desc, ir.created_at desc limit 1) as featured_reel_url
     from influencers i
     where i.id = $1 and i.active = true and i.public_visible = true and i.approval_status = 'approved'`,
    [id]
  )
  if (!row) redirect('/dashboard/influencers')

  const reels = await query<Pick<InfluencerReel, 'id' | 'title' | 'gif_url' | 'video_url' | 'thumbnail_url' | 'category_tags' | 'is_featured' | 'display_order'>>(
    `select id, title, gif_url, video_url, thumbnail_url, category_tags, is_featured, display_order
     from influencer_reels
     where influencer_id = $1 and approval_status = 'approved'
     order by is_featured desc, display_order asc, created_at desc
     limit 30`,
    [row.id]
  )

  // fire-and-forget view count
  query('update influencers set profile_views = profile_views + 1 where id = $1', [row.id]).catch(() => {})

  const influencer = toPublicInfluencer(row)

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/influencers" className="app-subtle text-sm hover:underline">← Back to creators</Link>
      </div>
      <InfluencerProfilePageClient influencer={influencer} reels={reels} orgId={me.user.org_id ?? ''} />
    </div>
  )
}
