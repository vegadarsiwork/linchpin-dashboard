import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import type { Influencer, InfluencerReel } from '@/lib/types'

function isAllowedPreviewUrl(url: string) {
  const clean = url.split('?')[0].toLowerCase()
  return clean.endsWith('.gif') || clean.endsWith('.mp4') || clean.endsWith('.webm') || clean.endsWith('.mov') || clean.endsWith('.jpg') || clean.endsWith('.jpeg') || clean.endsWith('.png') || clean.endsWith('.webp')
}

function isVideoPreviewUrl(url: string) {
  return Boolean(url.toLowerCase().split('?')[0].match(/\.(mp4|webm|mov)$/))
}

export async function POST(req: NextRequest) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
  if (me.user.role !== 'influencer') return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

  let body: {
    title?: string
    preview_url?: string
    original_url?: string
    media_asset_id?: string
    category_tags?: string[]
    is_featured?: boolean
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const influencer = await queryOne<Influencer>('select * from influencers where user_id = $1', [me.user.id])
  if (!influencer) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const countResult = await queryOne<{ count: string }>(
    'select count(*) from influencer_reels where influencer_id = $1',
    [influencer.id]
  )
  if (Number(countResult?.count ?? 0) >= 30) {
    return NextResponse.json(
      { error: 'Portfolio limit reached (30 items max). Delete an item first.' },
      { status: 400 }
    )
  }

  const title = body.title?.trim() || 'Trial reel'
  const previewUrl = body.preview_url?.trim()
  const originalUrl = body.original_url?.trim() || null
  if (!previewUrl || !isAllowedPreviewUrl(previewUrl)) {
    return NextResponse.json({ error: 'Upload or paste a direct MP4, WebM, GIF, or image preview URL.' }, { status: 400 })
  }

  const isVideo = isVideoPreviewUrl(previewUrl)
  if (body.is_featured) {
    await query('update influencer_reels set is_featured = false where influencer_id = $1', [influencer.id])
  }

  const reel = await queryOne<InfluencerReel>(
    `insert into influencer_reels (
      influencer_id, title, gif_url, video_url, source_url,
      category_tags, is_featured, approval_status
    ) values ($1, $2, $3, $4, $5, $6, $7, 'pending_review')
    returning *`,
    [
      influencer.id,
      title.slice(0, 120),
      previewUrl && !isVideo ? previewUrl : null,
      previewUrl && isVideo ? previewUrl : null,
      originalUrl,
      body.category_tags ?? [],
      body.is_featured ?? false,
    ]
  )

  return NextResponse.json({ reel }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
  if (me.user.role !== 'influencer') return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

  let body: { id?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!body.id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const influencer = await queryOne<Influencer>('select id from influencers where user_id = $1', [me.user.id])
  if (!influencer) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const deleted = await queryOne<{ id: string }>(
    'delete from influencer_reels where id = $1 and influencer_id = $2 returning id',
    [body.id, influencer.id]
  )
  if (!deleted) return NextResponse.json({ error: 'Reel not found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
  if (me.user.role !== 'influencer') return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

  let body: { id?: string; direction?: 'up' | 'down' }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!body.id || !body.direction) return NextResponse.json({ error: 'id and direction required' }, { status: 400 })

  const influencer = await queryOne<Influencer>('select id from influencers where user_id = $1', [me.user.id])
  if (!influencer) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  type ReelOrder = { id: string; display_order: number }
  const reels = await query<ReelOrder>(
    'select id, display_order from influencer_reels where influencer_id = $1 order by display_order asc, created_at asc',
    [influencer.id]
  )
  const idx = reels.findIndex((r) => r.id === body.id)
  if (idx === -1) return NextResponse.json({ error: 'Reel not found' }, { status: 404 })

  const swapIdx = body.direction === 'up' ? idx - 1 : idx + 1
  if (swapIdx < 0 || swapIdx >= reels.length) return NextResponse.json({ ok: true })

  const updates: Array<{ id: string; order: number }> = reels.map((r, i) => ({ id: r.id, order: i }))
  const temp = updates[idx].order
  updates[idx].order = updates[swapIdx].order
  updates[swapIdx].order = temp

  await query('update influencer_reels set display_order = $1 where id = $2 and influencer_id = $3', [updates[swapIdx].order, reels[idx].id, influencer.id])
  await query('update influencer_reels set display_order = $1 where id = $2 and influencer_id = $3', [updates[idx].order, reels[swapIdx].id, influencer.id])

  return NextResponse.json({ ok: true })
}
