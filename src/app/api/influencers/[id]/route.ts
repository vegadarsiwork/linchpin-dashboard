import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import type { Influencer } from '@/lib/types'
import { toPublicInfluencer } from '@/lib/influencers/public'

type ReelPublic = {
  id: string
  title: string
  gif_url: string | null
  video_url: string | null
  thumbnail_url: string | null
  category_tags: string[]
  is_featured: boolean
  display_order: number
}

type PublicInfluencerRow = Influencer & { featured_reel_url: string | null }

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const me = await getCurrentUser()
    if (!me) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })

    const { id } = await ctx.params

    const influencer = await queryOne<PublicInfluencerRow>(
      `select i.*,
        (
          select coalesce(ir.gif_url, ir.video_url, ir.thumbnail_url)
          from influencer_reels ir
          where ir.influencer_id = i.id
            and ir.approval_status = 'approved'
          order by ir.is_featured desc, ir.created_at desc
          limit 1
        ) as featured_reel_url
      from influencers i
      where i.id = $1 and i.active = true and i.public_visible = true and i.approval_status = 'approved'`,
      [id]
    )

    if (!influencer) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
    }

    const reels = await query<ReelPublic>(
      `select id, title, gif_url, video_url, thumbnail_url, category_tags, is_featured, display_order
       from influencer_reels
       where influencer_id = $1 and approval_status = 'approved'
       order by is_featured desc, display_order asc, created_at desc
       limit 30`,
      [id]
    )

    // Fire-and-forget profile view increment
    query('update influencers set profile_views = profile_views + 1 where id = $1', [id])

    return NextResponse.json({ influencer: toPublicInfluencer(influencer), reels })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load creator' },
      { status: 500 }
    )
  }
}
