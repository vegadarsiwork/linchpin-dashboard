'use client'

import { Play } from 'lucide-react'
import type { PublicInfluencer, PublicInfluencerMatch } from '@/lib/types'

export function fmtCount(n: number | null) {
  if (n == null) return null
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return String(n)
}

export function fmtInr(min: number | null, max: number | null) {
  if (min == null && max == null) return 'Price on request'
  if (min != null && max != null) return `Rs ${min.toLocaleString('en-IN')}-${max.toLocaleString('en-IN')}`
  return `From Rs ${(min ?? max)?.toLocaleString('en-IN')}`
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase()
}

function mediaKind(url: string | undefined) {
  if (!url) return 'fallback'
  const clean = url.split('?')[0].toLowerCase()
  if (clean.endsWith('.mp4') || clean.endsWith('.webm') || clean.endsWith('.mov')) return 'video'
  if (clean.endsWith('.gif') || clean.endsWith('.jpg') || clean.endsWith('.jpeg') || clean.endsWith('.png') || clean.endsWith('.webp')) return 'image'
  return 'fallback'
}

export function ReelPreview({ influencer, match }: { influencer: PublicInfluencer; match?: PublicInfluencerMatch }) {
  const sampleUrl = influencer.featured_reel_url ?? influencer.sample_content_urls[0]
  const kind = mediaKind(sampleUrl)
  const label = influencer.niches[0] ?? influencer.content_styles[0] ?? 'trial reel'

  return (
    <div className="relative aspect-[9/16] overflow-hidden rounded-lg bg-[#0f0b18]">
      {kind === 'video' && sampleUrl ? (
        <video src={sampleUrl} className="h-full w-full object-cover" autoPlay loop muted playsInline />
      ) : kind === 'image' && sampleUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={sampleUrl} alt={`${influencer.name} trial reel`} className="h-full w-full object-cover" />
      ) : (
        <div className="relative h-full w-full overflow-hidden bg-[radial-gradient(circle_at_25%_18%,rgba(124,60,255,0.42),transparent_34%),linear-gradient(145deg,#191128,#0b0812_58%,#211a33)]">
          {influencer.avatar_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={influencer.avatar_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30 blur-[1px]" />
          )}
          <div className="absolute inset-x-8 top-12 h-24 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute left-4 right-4 top-5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">
            <span>Trial GIF</span><span>{influencer.platform ?? 'Creator'}</span>
          </div>
          <div className="absolute inset-x-5 top-1/2 -translate-y-1/2 space-y-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/25">
              <Play className="h-6 w-6 fill-white" />
            </div>
            <div>
              <div className="text-2xl font-semibold leading-tight text-white">{label}</div>
              <div className="mt-1 text-sm text-white/65">{influencer.city ?? 'India'} creator sample</div>
            </div>
          </div>
          <div className="absolute inset-x-5 bottom-6">
            <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
              <div className="h-full w-2/3 animate-pulse rounded-full bg-white/70" />
            </div>
          </div>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent p-4">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-white">{influencer.name}</h3>
            <p className="truncate text-xs text-white/70">
              {influencer.platform ?? 'Creator'}{influencer.city ? ` - ${influencer.city}` : ''}
            </p>
          </div>
          {match && <span className="rounded-md bg-white px-2 py-1 text-xs font-bold text-[#171225]">{match.score}%</span>}
        </div>
      </div>
    </div>
  )
}

export function CreatorCard({
  influencer,
  match,
  onRequest,
  onView,
  compact,
}: {
  influencer: PublicInfluencer
  match?: PublicInfluencerMatch
  onRequest: (influencer: PublicInfluencer, match?: PublicInfluencerMatch) => void
  onView?: (influencer: PublicInfluencer) => void
  compact?: boolean
}) {
  if (compact) {
    return (
      <article className="app-panel w-44 shrink-0 overflow-hidden rounded-lg cursor-pointer" onClick={() => onView?.(influencer)}>
        <ReelPreview influencer={influencer} />
        <div className="p-2">
          <div className="app-heading truncate text-xs font-semibold">{influencer.name}</div>
          <div className="app-subtle truncate text-[10px]">{influencer.platform ?? 'Creator'}</div>
        </div>
      </article>
    )
  }

  return (
    <article className="app-panel overflow-hidden rounded-lg">
      <ReelPreview influencer={influencer} match={match} />
      <div className="p-4">
        <div className="flex items-start gap-3">
          {influencer.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={influencer.avatar_url} alt={influencer.name} className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <div className="app-icon-surface flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold">
              {initials(influencer.name)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="app-heading truncate text-sm font-semibold">{influencer.name}</h3>
                <p className="app-subtle text-xs">
                  {influencer.platform ?? 'Creator'}{influencer.city ? ` - ${influencer.city}` : ''}
                </p>
              </div>
              {match && <span className="rounded-md bg-violet-600 px-2 py-1 text-xs font-bold text-white">{match.score}%</span>}
            </div>
            {influencer.public_bio && <p className="app-subtle mt-2 line-clamp-2 text-xs leading-5">{influencer.public_bio}</p>}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
          <div className="app-soft-panel rounded-md p-2">
            <div className="app-subtle">Followers</div>
            <div className="app-heading mt-0.5 font-semibold">{fmtCount(influencer.follower_count) ?? 'NA'}</div>
          </div>
          <div className="app-soft-panel rounded-md p-2">
            <div className="app-subtle">Eng.</div>
            <div className="app-heading mt-0.5 font-semibold">{influencer.engagement_rate != null ? `${influencer.engagement_rate}%` : 'NA'}</div>
          </div>
          <div className="app-soft-panel rounded-md p-2">
            <div className="app-subtle">Views</div>
            <div className="app-heading mt-0.5 font-semibold">{fmtCount(influencer.average_reel_views) ?? 'NA'}</div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {influencer.niches.slice(0, 4).map((niche) => (
            <span key={niche} className="rounded-full border border-zinc-200 px-2 py-0.5 text-[11px] capitalize text-zinc-600">{niche}</span>
          ))}
        </div>

        {match?.reasoning && (
          <div className="app-soft-panel app-subtle mt-3 rounded-md p-3 text-xs leading-5">{match.reasoning}</div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="app-accent text-xs font-medium">{fmtInr(influencer.price_range_min_inr, influencer.price_range_max_inr)}</div>
          <div className="flex gap-2">
            {onView && (
              <button
                onClick={() => onView(influencer)}
                className="rounded-md ring-1 ring-zinc-200 app-nav-item px-3 py-2 text-xs font-semibold"
              >
                View profile
              </button>
            )}
            <button
              onClick={() => onRequest(influencer, match)}
              className="rounded-md bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-700"
            >
              Enquire
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
