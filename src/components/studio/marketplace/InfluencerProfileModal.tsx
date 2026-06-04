'use client'

import { useEffect, useState } from 'react'
import { Loader2, X } from 'lucide-react'
import type { PublicInfluencer } from '@/lib/types'
import { InfluencerEnquiryModal } from './InfluencerEnquiryModal'

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

type ReelItem = {
  id: string
  title: string
  gif_url: string | null
  video_url: string | null
  thumbnail_url: string | null
  category_tags: string[]
  is_featured: boolean
}

type ProfileDetail = {
  influencer: PublicInfluencer
  reels: ReelItem[]
}

async function readJson(res: Response) {
  const text = await res.text()
  if (!text) return {}
  try {
    return JSON.parse(text) as Record<string, unknown>
  } catch {
    return {}
  }
}

export function InfluencerProfileModal({
  influencer,
  onClose,
}: {
  influencer: PublicInfluencer
  onClose: () => void
}) {
  const [detail, setDetail] = useState<ProfileDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [enquiryOpen, setEnquiryOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const res = await fetch(`/api/influencers/${influencer.id}`)
      const json = await readJson(res)
      if (!cancelled && res.ok) {
        setDetail({
          influencer: (json.influencer as PublicInfluencer) ?? influencer,
          reels: (json.reels as ReelItem[]) ?? [],
        })
      } else if (!cancelled) {
        setDetail({ influencer, reels: [] })
      }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [influencer])

  const profile = detail?.influencer ?? influencer
  const reels = detail?.reels ?? []
  const hasCover = !!profile.cover_photo_url
  const platformEntries = Object.entries(profile.platform_follower_counts ?? {})

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/60 py-8 px-4">
        <div className="app-panel w-full max-w-2xl rounded-xl shadow-2xl">
          {/* Hero */}
          <div className="relative h-40 overflow-hidden rounded-t-xl bg-gradient-to-br from-violet-900 to-zinc-900">
            {hasCover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.cover_photo_url!} alt="" className="h-full w-full object-cover" />
            ) : profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover opacity-30 blur-sm" />
            ) : null}
            <button
              onClick={onClose}
              className="absolute right-3 top-3 rounded-full bg-black/40 p-1.5 text-white hover:bg-black/60"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Avatar row */}
          <div className="relative px-5">
            <div className="flex items-end gap-4 -mt-8">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={profile.name}
                  className="h-16 w-16 rounded-full object-cover ring-4 ring-white"
                />
              ) : (
                <div className="app-icon-surface flex h-16 w-16 items-center justify-center rounded-full text-xl font-semibold ring-4 ring-white">
                  {profile.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              {profile.is_available && (
                <span className="mb-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                  Available
                </span>
              )}
            </div>
          </div>

          <div className="space-y-5 px-5 py-4">
            {/* Identity */}
            <div>
              <h2 className="app-heading text-xl font-semibold">{profile.name}</h2>
              {profile.handle && <div className="app-subtle text-sm">{profile.handle}</div>}
              <div className="app-subtle text-xs mt-1 flex flex-wrap gap-2">
                {profile.platform && <span>{profile.platform}</span>}
                {profile.city && <span>· {profile.city}</span>}
                {profile.gender && <span>· {profile.gender}</span>}
              </div>
            </div>

            {/* Bio */}
            {profile.public_bio && (
              <div>
                <div className="app-accent text-xs font-semibold uppercase tracking-widest mb-1">About</div>
                <p className="app-subtle text-sm leading-6">{profile.public_bio}</p>
              </div>
            )}

            {loading && (
              <div className="flex justify-center py-4">
                <Loader2 className="app-accent h-5 w-5 animate-spin" />
              </div>
            )}

            {/* Stats */}
            <div>
              <div className="app-accent text-xs font-semibold uppercase tracking-widest mb-2">Stats</div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="app-soft-panel rounded-md p-3">
                  <div className="app-subtle">Followers</div>
                  <div className="app-heading mt-0.5 font-semibold text-sm">{fmtCount(profile.follower_count) ?? 'NA'}</div>
                </div>
                <div className="app-soft-panel rounded-md p-3">
                  <div className="app-subtle">Engagement</div>
                  <div className="app-heading mt-0.5 font-semibold text-sm">
                    {profile.engagement_rate != null ? `${profile.engagement_rate}%` : 'NA'}
                  </div>
                </div>
                <div className="app-soft-panel rounded-md p-3">
                  <div className="app-subtle">Avg views</div>
                  <div className="app-heading mt-0.5 font-semibold text-sm">{fmtCount(profile.average_reel_views) ?? 'NA'}</div>
                </div>
              </div>
              {platformEntries.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {platformEntries.map(([platform, count]) => (
                    <div key={platform} className="app-soft-panel rounded-md px-3 py-2 text-xs">
                      <span className="app-subtle capitalize">{platform}: </span>
                      <span className="app-heading font-semibold">{fmtCount(count)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tags */}
            {(profile.niches.length > 0 || profile.languages.length > 0 || profile.content_styles.length > 0) && (
              <div>
                <div className="app-accent text-xs font-semibold uppercase tracking-widest mb-2">Tags</div>
                <div className="flex flex-wrap gap-1.5">
                  {profile.niches.map((n) => <Tag key={n} label={n} />)}
                  {profile.languages.map((l) => <Tag key={l} label={l} />)}
                  {profile.content_styles.map((s) => <Tag key={s} label={s} />)}
                </div>
              </div>
            )}

            {/* Collaboration types */}
            {(profile.collaboration_types.length > 0 || profile.preferred_campaign_types.length > 0) && (
              <div>
                <div className="app-accent text-xs font-semibold uppercase tracking-widest mb-2">Works on</div>
                <div className="flex flex-wrap gap-1.5">
                  {profile.collaboration_types.map((c) => <Tag key={c} label={c} />)}
                  {profile.preferred_campaign_types.map((c) => <Tag key={c} label={c} />)}
                </div>
              </div>
            )}

            {/* Past collaborations */}
            {profile.past_collaborations.length > 0 && (
              <div>
                <div className="app-accent text-xs font-semibold uppercase tracking-widest mb-2">Past collaborations</div>
                <div className="space-y-2">
                  {profile.past_collaborations.map((collab, i) => (
                    <div key={i} className="app-soft-panel rounded-md px-3 py-2 text-xs">
                      <div className="app-heading font-semibold">{collab.brand}{collab.year ? ` · ${collab.year}` : ''}</div>
                      {collab.type && <div className="app-subtle capitalize">{collab.type}</div>}
                      {collab.description && <div className="app-subtle mt-0.5 leading-5">{collab.description}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Portfolio reels */}
            {reels.length > 0 && (
              <div>
                <div className="app-accent text-xs font-semibold uppercase tracking-widest mb-2">Portfolio</div>
                <div className="grid grid-cols-3 gap-2">
                  {reels.slice(0, 9).map((reel) => {
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
                          <span className="absolute left-1 top-1 rounded bg-violet-600 px-1 py-0.5 text-[9px] font-bold text-white">Featured</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="flex gap-2 pt-1 border-t border-zinc-200">
              <button
                onClick={onClose}
                className="flex-1 h-10 rounded-md ring-1 ring-zinc-200 app-nav-item text-sm font-medium"
              >
                Close
              </button>
              <button
                onClick={() => setEnquiryOpen(true)}
                className="flex-1 h-10 rounded-md bg-violet-600 text-sm font-semibold text-white hover:bg-violet-700"
              >
                Enquire now
              </button>
            </div>
          </div>
        </div>
      </div>

      {enquiryOpen && (
        <InfluencerEnquiryModal
          influencer={profile}
          onClose={() => setEnquiryOpen(false)}
        />
      )}
    </>
  )
}
