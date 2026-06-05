'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, Clock, Pencil, ShieldCheck, XCircle } from 'lucide-react'
import type { Influencer, InfluencerReel } from '@/lib/types'
import { cn } from '@/lib/utils'
import { InfluencerProfileForm, type ProfileState } from './InfluencerProfileForm'
import { InfluencerPortfolioManager } from './InfluencerPortfolioManager'

type CreatorRequest = {
  id: string
  status: string
  request_source: string
  brief: Record<string, unknown>
  client_notes: string | null
  admin_notes: string | null
  created_at: string
  org_name: string | null
  campaign_name?: string | null
  campaign_start_date?: string | null
  campaign_end_date?: string | null
  deliverables?: string | null
  budget_range?: string | null
  requirements_notes?: string | null
}

const STATUS_COPY: Record<string, { label: string; cls: string }> = {
  draft: { label: 'Draft', cls: 'bg-zinc-100 text-zinc-700 ring-zinc-200' },
  pending_review: { label: 'Pending review', cls: 'bg-amber-50 text-amber-800 ring-amber-200' },
  approved: { label: 'Approved', cls: 'bg-emerald-50 text-emerald-800 ring-emerald-200' },
  rejected: { label: 'Needs changes', cls: 'bg-red-50 text-red-800 ring-red-200' },
  requested: { label: 'Requested', cls: 'bg-amber-50 text-amber-800 ring-amber-200' },
  under_review: { label: 'Linchpin reviewing', cls: 'bg-sky-50 text-sky-800 ring-sky-200' },
  confirmed: { label: 'Confirmed', cls: 'bg-emerald-50 text-emerald-800 ring-emerald-200' },
  unavailable: { label: 'Unavailable', cls: 'bg-red-50 text-red-800 ring-red-200' },
  script_ready: { label: 'Script ready', cls: 'bg-violet-50 text-violet-800 ring-violet-200' },
  in_production: { label: 'In production', cls: 'bg-indigo-50 text-indigo-800 ring-indigo-200' },
  delivered: { label: 'Delivered', cls: 'bg-zinc-100 text-zinc-700 ring-zinc-200' },
}

const panelClass = 'rounded-lg border border-zinc-200/80 bg-white shadow-sm'

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_COPY[status] ?? STATUS_COPY.draft
  return <span className={cn('rounded-md px-2.5 py-1 text-xs font-semibold ring-1', meta.cls)}>{meta.label}</span>
}

function arrayFromText(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean)
}

const APPROVAL_STATUS_DESCRIPTIONS: Record<string, string> = {
  draft: 'Complete your profile and submit for review',
  pending_review: 'Under Linchpin review',
  approved: 'Live on marketplace',
  rejected: 'Needs changes - check rejection reason',
}

export function InfluencerDashboardClient({
  influencer,
  reels,
  requests,
}: {
  influencer: Influencer
  reels: InfluencerReel[]
  requests: CreatorRequest[]
}) {
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<ProfileState>({
    display_name: influencer.display_name ?? influencer.name,
    city: influencer.city ?? '',
    avatar_url: influencer.avatar_url ?? '',
    cover_photo_url: influencer.cover_photo_url ?? '',
    public_bio: influencer.public_bio ?? '',
    niches: (influencer.niches ?? []).join(', '),
    content_styles: (influencer.content_styles ?? []).join(', '),
    languages: (influencer.languages ?? []).join(', '),
    audience_regions: (influencer.audience_regions ?? []).join(', '),
    follower_count: influencer.follower_count?.toString() ?? '',
    engagement_rate: influencer.engagement_rate?.toString() ?? '',
    price_range_min_inr: influencer.price_range_min_inr?.toString() ?? '',
    price_range_max_inr: influencer.price_range_max_inr?.toString() ?? '',
    average_reel_views: influencer.average_reel_views?.toString() ?? '',
    audience_age_range: influencer.audience_age_range ?? '',
    audience_gender_skew: influencer.audience_gender_skew ?? '',
    handle: influencer.handle ?? '',
    gender: influencer.gender ?? '',
    date_of_birth: influencer.date_of_birth ?? '',
    state: influencer.state ?? '',
    is_available: influencer.is_available ?? false,
    collaboration_types: influencer.collaboration_types ?? [],
    preferred_campaign_types: influencer.preferred_campaign_types ?? [],
    past_collaborations: influencer.past_collaborations ?? [],
    platform_links: influencer.platform_links ?? {},
    platform_follower_counts: influencer.platform_follower_counts ?? {},
  })
  const [approvalStatus, setApprovalStatus] = useState(influencer.approval_status)
  const [localRequests, setLocalRequests] = useState(requests)
  const [busyRequest, setBusyRequest] = useState<string | null>(null)

  const reelCount = reels.length

  const completion = useMemo(() => {
    const checks = [
      profile.display_name,
      profile.city,
      profile.public_bio,
      profile.niches,
      profile.languages,
      profile.gender,
      profile.handle,
      reelCount > 0,
      Boolean(profile.cover_photo_url || profile.avatar_url),
    ]
    return Math.round((checks.filter(Boolean).length / checks.length) * 100)
  }, [profile, reelCount])

  const missingItems = useMemo(() => {
    const items: string[] = []
    if (!profile.display_name) items.push('Display name')
    if (!profile.city) items.push('City')
    if (!profile.public_bio) items.push('Public bio')
    if (!profile.niches) items.push('Niches')
    if (!profile.languages) items.push('Languages')
    if (!profile.gender) items.push('Gender')
    if (!profile.handle) items.push('Instagram handle')
    if (!reelCount) items.push('At least one trial reel')
    if (!profile.cover_photo_url && !profile.avatar_url) items.push('Profile or cover photo')
    return items
  }, [profile, reelCount])

  async function saveProfile(submit = false) {
    setSaving(true)
    const payload = {
      display_name: profile.display_name.trim(),
      city: profile.city.trim() || null,
      avatar_url: profile.avatar_url.trim() || null,
      cover_photo_url: profile.cover_photo_url.trim() || null,
      public_bio: profile.public_bio.trim() || null,
      niches: arrayFromText(profile.niches),
      content_styles: arrayFromText(profile.content_styles),
      languages: arrayFromText(profile.languages),
      audience_regions: arrayFromText(profile.audience_regions),
      follower_count: profile.follower_count ? Number(profile.follower_count) : null,
      engagement_rate: profile.engagement_rate ? Number(profile.engagement_rate) : null,
      price_range_min_inr: profile.price_range_min_inr ? Number(profile.price_range_min_inr) : null,
      price_range_max_inr: profile.price_range_max_inr ? Number(profile.price_range_max_inr) : null,
      average_reel_views: profile.average_reel_views ? Number(profile.average_reel_views) : null,
      audience_age_range: profile.audience_age_range.trim() || null,
      audience_gender_skew: profile.audience_gender_skew.trim() || null,
      handle: profile.handle.trim() || null,
      gender: profile.gender || null,
      date_of_birth: profile.date_of_birth || null,
      state: profile.state.trim() || null,
      is_available: profile.is_available,
      collaboration_types: profile.collaboration_types,
      preferred_campaign_types: profile.preferred_campaign_types,
      past_collaborations: profile.past_collaborations,
      platform_links: profile.platform_links,
      platform_follower_counts: profile.platform_follower_counts,
      submit_for_review: submit,
    }
    const res = await fetch('/api/influencer/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) {
      toast.error(json.error ?? 'Could not save profile')
      return
    }
    if (submit) setApprovalStatus('pending_review')
    toast.success(submit ? 'Profile submitted for review' : 'Profile saved')
  }

  async function respondToRequest(id: string, action: 'available' | 'unavailable') {
    setBusyRequest(id)
    const res = await fetch('/api/influencer/requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    })
    const json = await res.json().catch(() => ({}))
    setBusyRequest(null)
    if (!res.ok) {
      toast.error(json.error ?? 'Could not update request')
      return
    }
    setLocalRequests((rows) =>
      rows.map((row) => row.id === id ? { ...row, status: action === 'available' ? 'under_review' : 'unavailable' } : row)
    )
    toast.success(action === 'available' ? 'Marked available' : 'Marked unavailable')
  }

  const pendingCount = localRequests.filter((r) => r.status === 'requested').length
  const isPendingReview = approvalStatus === 'pending_review'

  return (
    <div className="space-y-8">
      {isPendingReview && (
        <section className={cn(panelClass, 'overflow-hidden')}>
          <div className="grid gap-6 p-6 lg:grid-cols-[1fr_280px]">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800 ring-1 ring-amber-200">
                <ShieldCheck className="h-3.5 w-3.5" />
                Under Linchpin review
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
                  Sit tight, we&apos;re reviewing your profile.
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
                  Your creator profile has been sent to the Linchpin team. We&apos;ll review your public bio,
                  trial reels, and campaign fit before making it visible to brands.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href="#profile-form"
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800"
                >
                  <Pencil className="h-4 w-4" />
                  Edit profile
                </a>
                <a
                  href="#portfolio"
                  className="inline-flex h-10 items-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
                >
                  Add another trial reel
                </a>
              </div>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Profile progress
                  </div>
                  <div className="mt-1 text-3xl font-bold tabular-nums text-zinc-950">
                    {completion}%
                  </div>
                </div>
                <StatusBadge status={approvalStatus} />
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-[#7c3aed] transition-all"
                  style={{ width: `${completion}%` }}
                />
              </div>
              {missingItems.length > 0 ? (
                <div className="mt-4 space-y-1">
                  <div className="text-xs font-medium text-zinc-600">Still worth improving</div>
                  {missingItems.slice(0, 4).map((item) => (
                    <div key={item} className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <Clock className="h-3 w-3 shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  All required profile sections are complete.
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Home widgets */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Profile completeness */}
        <div className={cn(panelClass, 'p-4 space-y-2')}>
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Profile completeness</div>
          <div className="text-2xl font-bold text-zinc-950">{completion}%</div>
          <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
            <div className="h-full rounded-full bg-[#7c3aed] transition-all" style={{ width: `${completion}%` }} />
          </div>
          {missingItems.length > 0 && (
            <ul className="mt-1 space-y-0.5">
              {missingItems.map((item) => (
                <li key={item} className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <Clock className="h-3 w-3 shrink-0 text-zinc-400" />{item}
                </li>
              ))}
            </ul>
          )}
          {missingItems.length === 0 && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-700">
              <CheckCircle2 className="h-3 w-3" /> Profile complete
            </div>
          )}
        </div>

        {/* Profile status */}
        <div className={cn(panelClass, 'p-4 space-y-2')}>
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Profile status</div>
          <StatusBadge status={approvalStatus} />
          <p className="text-xs text-zinc-500">{APPROVAL_STATUS_DESCRIPTIONS[approvalStatus] ?? ''}</p>
          {influencer.rejection_reason && approvalStatus === 'rejected' && (
            <p className="text-xs text-red-600 bg-red-50 rounded p-2">{influencer.rejection_reason}</p>
          )}
        </div>

        {/* Quick links */}
        <div className={cn(panelClass, 'p-4 space-y-2')}>
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Quick links</div>
          <div className="space-y-1.5">
            <a href="#profile-form" className="block text-sm text-[#7c3aed] hover:underline">Edit profile</a>
            <a href="#portfolio" className="block text-sm text-[#7c3aed] hover:underline">Portfolio &amp; reels</a>
            <a href="#requests" className="block text-sm text-[#7c3aed] hover:underline">Campaign requests</a>
          </div>
        </div>

        {/* Campaign requests + profile views */}
        <div className={cn(panelClass, 'p-4 space-y-4')}>
          <div className="space-y-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Campaign requests</div>
            <div className="text-2xl font-bold text-zinc-950">{localRequests.length}</div>
            {pendingCount > 0 && (
              <a href="#requests" className="inline-block rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100">
                {pendingCount} new request{pendingCount !== 1 ? 's' : ''}
              </a>
            )}
          </div>
          <div className="space-y-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Profile views</div>
            <div className="text-2xl font-bold text-zinc-950">{influencer.profile_views ?? 0}</div>
          </div>
        </div>
      </section>

      {/* Profile form */}
      <section className={cn(panelClass, 'p-5')}>
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-zinc-950">Public profile</h2>
        </div>
        <InfluencerProfileForm
          profile={profile}
          setProfile={setProfile}
          saving={saving}
          onSave={saveProfile}
          completion={completion}
        />
      </section>

      {/* Portfolio */}
      <InfluencerPortfolioManager initialReels={reels} />

      {/* Campaign requests */}
      <section className={panelClass} id="requests">
        <div className="border-b border-zinc-200 p-5">
          <h2 className="text-lg font-semibold text-zinc-950">Campaign requests</h2>
          <p className="mt-1 text-sm text-zinc-500">You can mark availability here. Linchpin manages the client relationship and final confirmation.</p>
        </div>
        <div className="divide-y divide-zinc-200">
          {localRequests.length === 0 && <div className="p-8 text-center text-sm text-zinc-500">No campaign requests yet.</div>}
          {localRequests.map((request) => (
            <div key={request.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_auto]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-semibold">{request.campaign_name ?? request.org_name ?? 'Brand request'}</div>
                  <StatusBadge status={request.status} />
                </div>
                <div className="mt-2 text-sm text-zinc-600">
                  {[request.brief.brand_category, request.brief.goal, request.brief.format].filter(Boolean).join(' - ') || 'Campaign brief pending Linchpin review'}
                </div>
                {(request.campaign_start_date || request.campaign_end_date) && (
                  <div className="mt-1.5 text-xs text-zinc-500">
                    {request.campaign_start_date && <>Starts: {request.campaign_start_date}</>}
                    {request.campaign_start_date && request.campaign_end_date && ' · '}
                    {request.campaign_end_date && <>Ends: {request.campaign_end_date}</>}
                  </div>
                )}
                {request.deliverables && <div className="mt-1 text-xs text-zinc-500">Deliverables: {request.deliverables}</div>}
                {request.client_notes && <div className="mt-2 rounded-md bg-zinc-50 p-3 text-sm text-zinc-600">{request.client_notes}</div>}
                {request.admin_notes && <div className="mt-2 text-sm text-zinc-500">{request.admin_notes}</div>}
              </div>
              <div className="flex items-center gap-2">
                <button disabled={busyRequest === request.id} onClick={() => respondToRequest(request.id, 'available')} className="inline-flex h-9 items-center gap-2 rounded-md bg-emerald-700 px-3 text-xs font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60">
                  <CheckCircle2 className="h-4 w-4" /> Available
                </button>
                <button disabled={busyRequest === request.id} onClick={() => respondToRequest(request.id, 'unavailable')} className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 disabled:opacity-60">
                  <XCircle className="h-4 w-4" /> Unavailable
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
