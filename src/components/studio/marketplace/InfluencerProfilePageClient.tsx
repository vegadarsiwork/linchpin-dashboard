'use client'

import { useState } from 'react'
import type { PublicInfluencer, InfluencerReel } from '@/lib/types'
import { InfluencerEnquiryModal } from './InfluencerEnquiryModal'

type ReelRow = Pick<InfluencerReel, 'id' | 'title' | 'gif_url' | 'video_url' | 'thumbnail_url' | 'category_tags' | 'is_featured' | 'display_order'>

function fmtCount(n: number | null) {
  if (n == null) return null
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return String(n)
}

function Tag({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-zinc-200 px-2 py-0.5 text-[11px] capitalize text-zinc-600">
      {label}
    </span>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="app-accent text-xs font-semibold uppercase tracking-widest mb-3">{children}</div>
}

export function InfluencerProfilePageClient({
  influencer,
  reels,
}: {
  influencer: PublicInfluencer
  reels: ReelRow[]
  orgId: string
}) {
  const [enquiryOpen, setEnquiryOpen] = useState(false)

  const platformEntries = Object.entries(influencer.platform_follower_counts ?? {})
  const hasCover = !!influencer.cover_photo_url

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <div className="relative h-52 overflow-hidden rounded-xl bg-gradient-to-br from-violet-900 to-zinc-900">
        {hasCover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={influencer.cover_photo_url!} alt="" className="h-full w-full object-cover" />
        ) : influencer.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={influencer.avatar_url} alt="" className="h-full w-full object-cover opacity-25 blur-sm" />
        ) : null}
      </div>

      {/* Profile header */}
      <div className="app-panel rounded-xl p-5">
        <div className="flex flex-wrap items-end gap-4 -mt-14 mb-4">
          {influencer.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={influencer.avatar_url}
              alt={influencer.name}
              className="h-20 w-20 rounded-full object-cover ring-4 ring-white"
            />
          ) : (
            <div className="app-icon-surface flex h-20 w-20 items-center justify-center rounded-full text-2xl font-semibold ring-4 ring-white">
              {influencer.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          {influencer.is_available && (
            <span className="mb-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              Available
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="app-heading text-2xl font-semibold tracking-tight">{influencer.name}</h1>
            {influencer.handle && <div className="app-subtle text-sm">{influencer.handle}</div>}
            <div className="app-subtle text-xs mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
              {influencer.platform && <span>{influencer.platform}</span>}
              {influencer.city && <span>· {influencer.city}</span>}
              {influencer.gender && <span>· {influencer.gender}</span>}
              {influencer.audience_age_range && <span>· Audience: {influencer.audience_age_range}</span>}
              {influencer.audience_gender_skew && <span>· {influencer.audience_gender_skew}</span>}
            </div>
          </div>
          <button
            onClick={() => setEnquiryOpen(true)}
            className="rounded-md bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
          >
            Enquire now
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Bio */}
          {influencer.public_bio && (
            <div className="app-panel rounded-xl p-5">
              <SectionTitle>About</SectionTitle>
              <p className="app-subtle text-sm leading-6">{influencer.public_bio}</p>
            </div>
          )}

          {/* Tags */}
          {(influencer.niches.length > 0 || influencer.languages.length > 0 || influencer.content_styles.length > 0) && (
            <div className="app-panel rounded-xl p-5">
              <SectionTitle>Tags</SectionTitle>
              <div className="flex flex-wrap gap-1.5">
                {influencer.niches.map((n) => <Tag key={n} label={n} />)}
                {influencer.languages.map((l) => <Tag key={l} label={l} />)}
                {influencer.content_styles.map((s) => <Tag key={s} label={s} />)}
              </div>
            </div>
          )}

          {/* Collaboration types */}
          {(influencer.collaboration_types.length > 0 || influencer.preferred_campaign_types.length > 0) && (
            <div className="app-panel rounded-xl p-5">
              <SectionTitle>Works on</SectionTitle>
              <div className="flex flex-wrap gap-1.5">
                {influencer.collaboration_types.map((c) => <Tag key={c} label={c} />)}
                {influencer.preferred_campaign_types.map((c) => <Tag key={c} label={c} />)}
              </div>
            </div>
          )}

          {/* Past collaborations */}
          {influencer.past_collaborations.length > 0 && (
            <div className="app-panel rounded-xl p-5">
              <SectionTitle>Past collaborations</SectionTitle>
              <div className="space-y-2">
                {influencer.past_collaborations.map((collab, i) => (
                  <div key={i} className="app-soft-panel rounded-lg px-4 py-3 text-sm">
                    <div className="app-heading font-semibold">
                      {collab.brand}{collab.year ? <span className="app-subtle font-normal"> · {collab.year}</span> : null}
                    </div>
                    {collab.type && <div className="app-subtle text-xs capitalize mt-0.5">{collab.type}</div>}
                    {collab.description && <div className="app-subtle text-xs mt-1 leading-5">{collab.description}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Portfolio */}
          {reels.length > 0 && (
            <div className="app-panel rounded-xl p-5">
              <SectionTitle>Portfolio</SectionTitle>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {reels.map((reel) => {
                  const thumb = reel.thumbnail_url ?? reel.gif_url ?? reel.video_url
                  return (
                    <div key={reel.id} className="relative aspect-[9/16] overflow-hidden rounded-lg bg-zinc-100">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumb} alt={reel.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-zinc-200 text-[10px] text-zinc-400">No preview</div>
                      )}
                      {reel.is_featured && (
                        <span className="absolute left-1 top-1 rounded bg-violet-600 px-1 py-0.5 text-[9px] font-bold text-white">
                          Featured
                        </span>
                      )}
                      {reel.title && (
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                          <div className="truncate text-[10px] text-white">{reel.title}</div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar: stats */}
        <div className="space-y-4">
          <div className="app-panel rounded-xl p-5">
            <SectionTitle>Stats</SectionTitle>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="app-subtle">Followers</span>
                <span className="app-heading font-semibold">{fmtCount(influencer.follower_count) ?? 'NA'}</span>
              </div>
              <div className="flex justify-between">
                <span className="app-subtle">Engagement rate</span>
                <span className="app-heading font-semibold">
                  {influencer.engagement_rate != null ? `${influencer.engagement_rate}%` : 'NA'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="app-subtle">Avg reel views</span>
                <span className="app-heading font-semibold">{fmtCount(influencer.average_reel_views) ?? 'NA'}</span>
              </div>
            </div>

            {platformEntries.length > 0 && (
              <>
                <div className="my-3 border-t border-zinc-200" />
                <div className="space-y-2 text-sm">
                  {platformEntries.map(([platform, count]) => (
                    <div key={platform} className="flex justify-between">
                      <span className="app-subtle capitalize">{platform}</span>
                      <span className="app-heading font-semibold">{fmtCount(count)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {influencer.price_range_min_inr != null || influencer.price_range_max_inr != null ? (
            <div className="app-panel rounded-xl p-5">
              <SectionTitle>Pricing</SectionTitle>
              <div className="app-heading text-lg font-semibold">
                {influencer.price_range_min_inr != null && influencer.price_range_max_inr != null
                  ? `Rs ${influencer.price_range_min_inr.toLocaleString('en-IN')} – ${influencer.price_range_max_inr.toLocaleString('en-IN')}`
                  : `From Rs ${(influencer.price_range_min_inr ?? influencer.price_range_max_inr)?.toLocaleString('en-IN')}`
                }
              </div>
              <div className="app-subtle text-xs mt-1">Indicative range. Final pricing confirmed by Linchpin team.</div>
            </div>
          ) : null}

          <button
            onClick={() => setEnquiryOpen(true)}
            className="w-full rounded-md bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-700"
          >
            Enquire now
          </button>
        </div>
      </div>

      {enquiryOpen && (
        <InfluencerEnquiryModal
          influencer={influencer}
          onClose={() => setEnquiryOpen(false)}
        />
      )}
    </div>
  )
}
