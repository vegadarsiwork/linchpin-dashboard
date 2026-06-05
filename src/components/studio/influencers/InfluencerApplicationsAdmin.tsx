'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AlertCircle, CheckCircle2, Loader2, RotateCw, XCircle } from 'lucide-react'

export type ProfileRow = {
  id: string
  display_name: string | null
  name: string
  city: string | null
  niches: string[]
  public_bio: string | null
  approval_status: string
  owner_email: string | null
  public_profile_completed?: boolean | null
  profile_submitted_at?: string | null
  created_at?: string | null
}

export type ReelRow = {
  id: string
  title: string
  gif_url: string | null
  video_url: string | null
  thumbnail_url: string | null
  approval_status: string
  display_name: string | null
  name: string
}

function Badge({ status }: { status: string }) {
  const cls = status === 'approved'
    ? 'bg-emerald-100 text-emerald-800'
    : status === 'rejected'
      ? 'bg-red-100 text-red-800'
      : 'bg-amber-100 text-amber-800'
  return <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${cls}`}>{status.replaceAll('_', ' ')}</span>
}

function formatDate(value?: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function isVideoPreviewUrl(url: string | null | undefined) {
  if (!url) return false
  return Boolean(url.toLowerCase().split('?')[0].match(/\.(mp4|webm|mov)$/))
}

export function InfluencerApplicationsAdmin({
  initialProfiles = [],
  initialReels = [],
}: {
  initialProfiles?: ProfileRow[]
  initialReels?: ReelRow[]
}) {
  const [profiles, setProfiles] = useState<ProfileRow[]>(initialProfiles)
  const [reels, setReels] = useState<ReelRow[]>(initialReels)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/influencer-applications')
    const json = await res.json().catch(() => ({}))
    setLoading(false)
    if (!res.ok) {
      const message = json.error ?? 'Could not load applications'
      setError(message)
      toast.error(message)
      return
    }
    setError(null)
    setProfiles(json.profiles ?? [])
    setReels(json.reels ?? [])
  }

  useEffect(() => {
    if (initialProfiles.length === 0 && initialReels.length === 0) {
      load()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function update(type: 'profile' | 'reel', id: string, status: string) {
    setBusy(`${type}:${id}`)
    const res = await fetch('/api/admin/influencer-applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, id, status }),
    })
    const json = await res.json().catch(() => ({}))
    setBusy(null)
    if (!res.ok) {
      toast.error(json.error ?? 'Could not update')
      return
    }
    toast.success('Updated')
    await load()
  }

  if (loading) {
    return <div className="flex h-48 items-center justify-center rounded-xl border border-zinc-200 bg-white"><Loader2 className="h-5 w-5 animate-spin text-zinc-500" /></div>
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <div className="flex min-w-0 items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="truncate">Browser refresh failed: {error}. Showing server-loaded applications.</span>
          </div>
          <button
            onClick={load}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-amber-200 bg-white px-2.5 text-xs font-semibold text-amber-900"
          >
            <RotateCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
      <section className="rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold text-zinc-900">Profiles</h2>
            <button
              onClick={load}
              disabled={loading}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 text-xs font-semibold text-zinc-700 disabled:opacity-60"
            >
              <RotateCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
        <div className="divide-y divide-zinc-100">
          {profiles.map((profile) => (
            <div key={profile.id} className="grid gap-4 p-4 md:grid-cols-[1fr_auto]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-semibold text-zinc-900">{profile.display_name || profile.name}</div>
                  <Badge status={profile.approval_status} />
                </div>
                <div className="mt-1 text-sm text-zinc-500">{profile.city || 'No city'} - {profile.owner_email || 'No owner email'}</div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500">
                  <span>{profile.public_profile_completed ? 'Profile completed' : 'Profile incomplete'}</span>
                  {formatDate(profile.profile_submitted_at) && <span>Submitted {formatDate(profile.profile_submitted_at)}</span>}
                  {!profile.profile_submitted_at && formatDate(profile.created_at) && <span>Created {formatDate(profile.created_at)}</span>}
                </div>
                {profile.public_bio && <p className="mt-2 max-w-2xl text-sm text-zinc-600">{profile.public_bio}</p>}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(profile.niches ?? []).slice(0, 6).map((niche) => <span key={niche} className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600">{niche}</span>)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button disabled={busy === `profile:${profile.id}`} onClick={() => update('profile', profile.id, 'approved')} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-emerald-700 px-3 text-xs font-semibold text-white disabled:opacity-60"><CheckCircle2 className="h-4 w-4" /> Approve</button>
                <button disabled={busy === `profile:${profile.id}`} onClick={() => update('profile', profile.id, 'rejected')} className="inline-flex h-9 items-center gap-1.5 rounded-md border border-zinc-200 px-3 text-xs font-semibold text-zinc-700 disabled:opacity-60"><XCircle className="h-4 w-4" /> Reject</button>
              </div>
            </div>
          ))}
          {profiles.length === 0 && <div className="p-8 text-center text-sm text-zinc-500">No creator profiles yet.</div>}
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 p-4">
          <h2 className="font-semibold text-zinc-900">Trial reels</h2>
        </div>
        <div className="grid gap-3 p-4">
          {reels.map((reel) => {
            const src = reel.gif_url || reel.video_url || reel.thumbnail_url
            const isVideo = Boolean(reel.video_url) || isVideoPreviewUrl(src)
            return (
              <div key={reel.id} className="overflow-hidden rounded-lg border border-zinc-200">
                <div className="grid grid-cols-[110px_1fr]">
                  <div className="aspect-[9/16] bg-zinc-100">
                    {src && isVideo ? <video src={src} autoPlay muted loop playsInline className="h-full w-full object-cover" /> : src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={src} alt={reel.title} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="space-y-3 p-3">
                    <div>
                      <div className="text-sm font-semibold text-zinc-900">{reel.title}</div>
                      <div className="mt-1 text-xs text-zinc-500">{reel.display_name || reel.name}</div>
                    </div>
                    <Badge status={reel.approval_status} />
                    <div className="flex gap-2">
                      <button disabled={busy === `reel:${reel.id}`} onClick={() => update('reel', reel.id, 'approved')} className="h-8 rounded-md bg-zinc-900 px-2.5 text-xs font-semibold text-white disabled:opacity-60">Approve</button>
                      <button disabled={busy === `reel:${reel.id}`} onClick={() => update('reel', reel.id, 'rejected')} className="h-8 rounded-md border border-zinc-200 px-2.5 text-xs font-semibold text-zinc-700 disabled:opacity-60">Reject</button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          {reels.length === 0 && <div className="p-8 text-center text-sm text-zinc-500">No trial reels yet.</div>}
        </div>
      </section>
      </div>
    </div>
  )
}
