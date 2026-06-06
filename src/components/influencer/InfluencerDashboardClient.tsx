'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Eye,
  FileVideo,
  Megaphone,
  Pencil,
  ShieldCheck,
  Sparkles,
  ToggleRight,
  XCircle,
} from 'lucide-react'
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
  approved: { label: 'Live', cls: 'bg-emerald-50 text-emerald-800 ring-emerald-200' },
  rejected: { label: 'Changes needed', cls: 'bg-red-50 text-red-800 ring-red-200' },
  requested: { label: 'Requested', cls: 'bg-amber-50 text-amber-800 ring-amber-200' },
  under_review: { label: 'Linchpin reviewing', cls: 'bg-sky-50 text-sky-800 ring-sky-200' },
  confirmed: { label: 'Confirmed', cls: 'bg-emerald-50 text-emerald-800 ring-emerald-200' },
  unavailable: { label: 'Unavailable', cls: 'bg-red-50 text-red-800 ring-red-200' },
  script_ready: { label: 'Script ready', cls: 'bg-violet-50 text-violet-800 ring-violet-200' },
  in_production: { label: 'In production', cls: 'bg-indigo-50 text-indigo-800 ring-indigo-200' },
  delivered: { label: 'Delivered', cls: 'bg-zinc-100 text-zinc-700 ring-zinc-200' },
}

const panelClass = 'rounded-lg border border-zinc-200/80 bg-white shadow-sm'
const softPanelClass = 'rounded-lg border border-zinc-200 bg-[#fbfaf7]'

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_COPY[status] ?? STATUS_COPY.draft
  return <span className={cn('rounded-md px-2.5 py-1 text-xs font-semibold ring-1', meta.cls)}>{meta.label}</span>
}

function arrayFromText(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean)
}

function formatDate(value: string | null | undefined) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(date)
}

function StatCard({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string
  value: string | number
  icon: typeof BarChart3
  hint?: string
}) {
  return (
    <div className={cn(panelClass, 'p-4')}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</div>
          <div className="mt-2 text-2xl font-bold tabular-nums text-zinc-950">{value}</div>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-violet-50 text-[#7c3aed] ring-1 ring-violet-100">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      {hint && <p className="mt-2 text-xs leading-5 text-zinc-500">{hint}</p>}
    </div>
  )
}

function ProgressMeter({ completion }: { completion: number }) {
  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Profile strength</div>
          <div className="mt-1 text-3xl font-bold tabular-nums text-zinc-950">{completion}%</div>
        </div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-100">
        <div className="h-full rounded-full bg-[#7c3aed] transition-all" style={{ width: `${completion}%` }} />
      </div>
    </div>
  )
}

function Checklist({
  missingItems,
  reelCount,
  approvedReelCount,
  approvalStatus,
}: {
  missingItems: string[]
  reelCount: number
  approvedReelCount: number
  approvalStatus: string
}) {
  const rows = [
    { label: 'Profile details saved', done: missingItems.length === 0 },
    { label: 'Trial reel preview uploaded', done: reelCount > 0 },
    { label: 'Linchpin profile review', done: approvalStatus === 'approved' },
    { label: 'Approved reel visible in marketplace', done: approvedReelCount > 0 && approvalStatus === 'approved' },
  ]

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-2 text-sm">
          {row.done ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          ) : (
            <Clock className="h-4 w-4 text-zinc-400" />
          )}
          <span className={row.done ? 'text-zinc-800' : 'text-zinc-500'}>{row.label}</span>
        </div>
      ))}
    </div>
  )
}

function RequestList({
  requests,
  busyRequest,
  onRespond,
}: {
  requests: CreatorRequest[]
  busyRequest: string | null
  onRespond: (id: string, action: 'available' | 'unavailable') => void
}) {
  return (
    <section className={panelClass} id="requests">
      <div className="border-b border-zinc-200 p-5">
        <h2 className="text-lg font-semibold text-zinc-950">Campaign requests</h2>
        <p className="mt-1 text-sm text-zinc-500">
          You can mark availability here. Linchpin manages the client relationship and final confirmation.
        </p>
      </div>
      <div className="divide-y divide-zinc-200">
        {requests.length === 0 && (
          <div className="p-8 text-center text-sm text-zinc-500">No campaign requests yet.</div>
        )}
        {requests.map((request) => (
          <div key={request.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_auto]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="font-semibold text-zinc-950">
                  {request.campaign_name ?? request.org_name ?? 'Brand request'}
                </div>
                <StatusBadge status={request.status} />
              </div>
              <div className="mt-2 text-sm text-zinc-600">
                {[request.brief.brand_category, request.brief.goal, request.brief.format].filter(Boolean).join(' - ') ||
                  'Campaign brief pending Linchpin review'}
              </div>
              {(request.campaign_start_date || request.campaign_end_date) && (
                <div className="mt-1.5 text-xs text-zinc-500">
                  {request.campaign_start_date && <>Starts: {request.campaign_start_date}</>}
                  {request.campaign_start_date && request.campaign_end_date && ' - '}
                  {request.campaign_end_date && <>Ends: {request.campaign_end_date}</>}
                </div>
              )}
              {request.deliverables && (
                <div className="mt-1 text-xs text-zinc-500">Deliverables: {request.deliverables}</div>
              )}
              {request.client_notes && (
                <div className="mt-2 rounded-md bg-zinc-50 p-3 text-sm text-zinc-600">{request.client_notes}</div>
              )}
              {request.admin_notes && <div className="mt-2 text-sm text-zinc-500">{request.admin_notes}</div>}
            </div>
            {request.status === 'requested' ? (
              <div className="flex items-center gap-2">
                <button
                  disabled={busyRequest === request.id}
                  onClick={() => onRespond(request.id, 'available')}
                  className="inline-flex h-9 items-center gap-2 rounded-md bg-emerald-700 px-3 text-xs font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
                >
                  <CheckCircle2 className="h-4 w-4" /> Available
                </button>
                <button
                  disabled={busyRequest === request.id}
                  onClick={() => onRespond(request.id, 'unavailable')}
                  className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 disabled:opacity-60"
                >
                  <XCircle className="h-4 w-4" /> Unavailable
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  )
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
  const [localReels, setLocalReels] = useState(reels)
  const [busyRequest, setBusyRequest] = useState<string | null>(null)
  const [editingProfile, setEditingProfile] = useState(approvalStatus === 'draft' || approvalStatus === 'rejected')

  const reelCount = localReels.length
  const approvedReelCount = localReels.filter((reel) => reel.approval_status === 'approved').length
  const pendingReelCount = localReels.filter((reel) => reel.approval_status === 'pending_review').length
  const pendingCount = localRequests.filter((request) => request.status === 'requested').length
  const activeRequestCount = localRequests.filter((request) =>
    ['requested', 'under_review', 'confirmed', 'script_ready', 'in_production'].includes(request.status)
  ).length

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
    if (submit) {
      setApprovalStatus('pending_review')
      setEditingProfile(false)
    }
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

  const firstName = (profile.display_name || influencer.name).split(' ')[0] || 'Creator'
  const submittedAt = formatDate(influencer.profile_submitted_at)
  const approvedAt = formatDate(influencer.approved_at)

  const showOnboarding = approvalStatus === 'draft' || approvalStatus === 'rejected' || editingProfile
  const showPortfolioEditor = approvalStatus !== 'approved' || editingProfile

  return (
    <div className="space-y-6">
      {approvalStatus === 'pending_review' && !editingProfile && (
        <section className={cn(panelClass, 'overflow-hidden')}>
          <div className="grid gap-6 p-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800 ring-1 ring-amber-200">
                <ShieldCheck className="h-3.5 w-3.5" />
                Under Linchpin review
              </div>
              <div>
                <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-zinc-950">
                  Sit tight, {firstName}. Your creator profile is in review.
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
                  Your profile is no longer in onboarding. Linchpin is checking your public profile, trial reels,
                  and campaign fit before brands can request you in the marketplace.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className={cn(softPanelClass, 'p-4')}>
                  <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Submitted</div>
                  <div className="mt-1 text-sm font-semibold text-zinc-900">{submittedAt ?? 'Today'}</div>
                </div>
                <div className={cn(softPanelClass, 'p-4')}>
                  <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Trial reels</div>
                  <div className="mt-1 text-sm font-semibold text-zinc-900">{reelCount} uploaded</div>
                </div>
                <div className={cn(softPanelClass, 'p-4')}>
                  <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Visibility</div>
                  <div className="mt-1 text-sm font-semibold text-zinc-900">Locked until approval</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setEditingProfile(true)}
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800"
                >
                  <Pencil className="h-4 w-4" />
                  Edit profile
                </button>
                <a
                  href="#portfolio"
                  className="inline-flex h-10 items-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
                >
                  Add another trial reel
                </a>
              </div>
            </div>
            <div className={cn(softPanelClass, 'space-y-5 p-5')}>
              <ProgressMeter completion={completion} />
              <div className="border-t border-zinc-200 pt-4">
                <Checklist
                  missingItems={missingItems}
                  reelCount={reelCount}
                  approvedReelCount={approvedReelCount}
                  approvalStatus={approvalStatus}
                />
              </div>
              <p className="rounded-md bg-white p-3 text-xs leading-5 text-zinc-500 ring-1 ring-zinc-200">
                Brands cannot see your direct contact details. Linchpin handles availability, negotiation, and campaign coordination.
              </p>
            </div>
          </div>
        </section>
      )}

      {approvalStatus === 'approved' && !editingProfile && (
        <section className={cn(panelClass, 'overflow-hidden')}>
          <div className="grid gap-6 p-6 lg:grid-cols-[1fr_300px]">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800 ring-1 ring-emerald-200">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Live in marketplace
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
                  Your creator profile is live, {firstName}.
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
                  Brands can discover your approved profile and request you through Linchpin. Keep your availability,
                  pricing range, and reel previews current so the team can match you faster.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setEditingProfile(true)}
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800"
                >
                  <Pencil className="h-4 w-4" />
                  Edit profile
                </button>
                <a
                  href="#requests"
                  className="inline-flex h-10 items-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
                >
                  View requests
                </a>
              </div>
            </div>
            <div className={cn(softPanelClass, 'space-y-4 p-5')}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Marketplace visibility</div>
                  <div className="mt-1 text-lg font-semibold text-zinc-950">Live</div>
                </div>
                <ToggleRight className="h-7 w-7 text-emerald-600" />
              </div>
              <div className="border-t border-zinc-200 pt-4">
                <div className="text-xs text-zinc-500">Approved {approvedAt ?? 'by Linchpin'}</div>
                <div className="mt-2 text-sm text-zinc-700">
                  {profile.is_available ? 'Marked available for campaigns.' : 'Marked unavailable. Turn availability on when ready.'}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {approvalStatus === 'rejected' && !editingProfile && (
        <section className={cn(panelClass, 'overflow-hidden border-red-200 bg-red-50/40')}>
          <div className="grid gap-6 p-6 lg:grid-cols-[1fr_300px]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-800 ring-1 ring-red-200">
                <XCircle className="h-3.5 w-3.5" />
                Changes needed
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950">
                Update your profile and resubmit.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
                Linchpin reviewed your profile and needs changes before it can go live in the marketplace.
              </p>
              {influencer.rejection_reason && (
                <div className="mt-4 rounded-md border border-red-200 bg-white p-4 text-sm leading-6 text-red-800">
                  {influencer.rejection_reason}
                </div>
              )}
              <button
                onClick={() => setEditingProfile(true)}
                className="mt-5 inline-flex h-10 items-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                <Pencil className="h-4 w-4" />
                Fix profile
              </button>
            </div>
            <div className={cn(softPanelClass, 'p-5')}>
              <ProgressMeter completion={completion} />
              {missingItems.length > 0 && (
                <div className="mt-4 space-y-1.5">
                  {missingItems.map((item) => (
                    <div key={item} className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <Clock className="h-3 w-3 shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {(approvalStatus === 'draft' || showOnboarding) && (
        <section className={cn(panelClass, 'p-5')} id="profile-form">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <StatusBadge status={approvalStatus} />
              <h2 className="mt-3 text-xl font-semibold text-zinc-950">
                {approvalStatus === 'draft' ? 'Build your creator profile' : 'Edit public profile'}
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-500">
                Complete the details brands need to evaluate your fit. Your direct contact details are never shown to clients.
              </p>
            </div>
            {approvalStatus !== 'draft' && (
              <button
                onClick={() => setEditingProfile(false)}
                className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Close editor
              </button>
            )}
          </div>
          <InfluencerProfileForm
            profile={profile}
            setProfile={setProfile}
            saving={saving}
            onSave={saveProfile}
            completion={completion}
          />
        </section>
      )}

      {showPortfolioEditor ? (
        <InfluencerPortfolioManager initialReels={localReels} onReelsChange={setLocalReels} />
      ) : (
        <section className={panelClass} id="portfolio">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 p-5">
            <div>
              <h2 className="text-lg font-semibold text-zinc-950">Trial reel portfolio</h2>
              <p className="mt-1 text-sm text-zinc-500">Approved previews brands can browse in the marketplace.</p>
            </div>
            <button
              onClick={() => setEditingProfile(true)}
              className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              Manage reels
            </button>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
            {localReels.length === 0 && (
              <div className="col-span-full rounded-lg border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500">
                No trial reels uploaded yet.
              </div>
            )}
            {localReels.slice(0, 8).map((reel) => {
              const src = reel.video_url || reel.gif_url || reel.thumbnail_url
              return (
                <div key={reel.id} className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
                  <div className="aspect-[9/16] bg-zinc-100">
                    {src && reel.video_url ? (
                      <video src={src} autoPlay muted loop playsInline className="h-full w-full object-cover" />
                    ) : src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={src} alt={reel.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-zinc-400">No preview</div>
                    )}
                  </div>
                  <div className="space-y-2 p-3">
                    <div className="truncate text-sm font-semibold text-zinc-950">{reel.title}</div>
                    <StatusBadge status={reel.approval_status} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Profile views" value={influencer.profile_views ?? 0} icon={Eye} hint="Marketplace views after approval." />
        <StatCard label="Requests received" value={localRequests.length} icon={Megaphone} hint={`${pendingCount} waiting for your availability.`} />
        <StatCard label="Active requests" value={activeRequestCount} icon={Sparkles} hint="Requested, confirmed, or in production." />
        <StatCard label="Approved reels" value={approvedReelCount} icon={FileVideo} hint={`${pendingReelCount} still under review.`} />
      </section>

      <RequestList requests={localRequests} busyRequest={busyRequest} onRespond={respondToRequest} />
    </div>
  )
}
