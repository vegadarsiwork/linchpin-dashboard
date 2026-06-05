'use client'

import React, { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { UploadButton } from '@/lib/uploadthing'
import { toast } from 'sonner'

export type PastCollab = { brand: string; year?: string; type?: string; description?: string }

export type ProfileState = {
  display_name: string
  city: string
  avatar_url: string
  cover_photo_url: string
  public_bio: string
  niches: string
  content_styles: string
  languages: string
  audience_regions: string
  follower_count: string
  engagement_rate: string
  price_range_min_inr: string
  price_range_max_inr: string
  average_reel_views: string
  audience_age_range: string
  audience_gender_skew: string
  handle: string
  gender: string
  date_of_birth: string
  state: string
  is_available: boolean
  collaboration_types: string[]
  preferred_campaign_types: string[]
  past_collaborations: PastCollab[]
  platform_links: Record<string, string>
  platform_follower_counts: Record<string, number>
}

const PLATFORMS = ['Instagram', 'YouTube', 'Twitter', 'LinkedIn', 'TikTok']
const COLLAB_TYPES = ['Reel', 'Story', 'Post', 'YouTube Video', 'Blog', 'Podcast', 'Live']
const CAMPAIGN_TYPES = ['Brand awareness', 'Product launch', 'Performance/conversion', 'Tutorial', 'Event', 'Gifted']
const COLLAB_FORMAT_OPTIONS = ['Reel', 'Story', 'Post', 'YouTube Video', 'Blog', 'Podcast', 'Live']

function fieldClass() {
  return 'h-10 w-full rounded-md border border-zinc-200 bg-[#fbfaf7] px-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-[#7c3aed] focus:bg-white focus:ring-2 focus:ring-violet-100'
}

function toggleCheckbox(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]
}

type Props = {
  profile: ProfileState
  setProfile: React.Dispatch<React.SetStateAction<ProfileState>>
  saving: boolean
  onSave: (submit?: boolean) => void
  completion: number
}

export function InfluencerProfileForm({ profile, setProfile, saving, onSave, completion }: Props) {
  const [collabForm, setCollabForm] = useState<PastCollab>({ brand: '', year: '', type: '', description: '' })

  function addCollab() {
    if (!collabForm.brand.trim()) return
    if (profile.past_collaborations.length >= 10) return
    setProfile((p) => ({ ...p, past_collaborations: [...p.past_collaborations, { ...collabForm }] }))
    setCollabForm({ brand: '', year: '', type: '', description: '' })
  }

  function removeCollab(index: number) {
    setProfile((p) => ({ ...p, past_collaborations: p.past_collaborations.filter((_, i) => i !== index) }))
  }

  return (
    <div className="space-y-6" id="profile-form">
      {/* Basic info */}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5"><span className="text-sm font-medium">Display name</span><input className={fieldClass()} value={profile.display_name} onChange={(e) => setProfile({ ...profile, display_name: e.target.value })} /></label>
        <label className="space-y-1.5"><span className="text-sm font-medium">Instagram handle / @username</span><input className={fieldClass()} value={profile.handle} onChange={(e) => setProfile({ ...profile, handle: e.target.value })} placeholder="@yourhandle" /></label>
        <label className="space-y-1.5"><span className="text-sm font-medium">City</span><input className={fieldClass()} value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })} /></label>
        <label className="space-y-1.5"><span className="text-sm font-medium">State</span><input className={fieldClass()} value={profile.state} onChange={(e) => setProfile({ ...profile, state: e.target.value })} /></label>
        <label className="space-y-1.5">
          <span className="text-sm font-medium">Gender</span>
          <select className={fieldClass()} value={profile.gender} onChange={(e) => setProfile({ ...profile, gender: e.target.value })}>
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Non-binary">Non-binary</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
        </label>
        <label className="space-y-1.5"><span className="text-sm font-medium">Date of birth (for age filtering)</span><input type="date" className={fieldClass()} value={profile.date_of_birth} onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })} /></label>

        {/* Profile photos */}
        <div className="space-y-2 sm:col-span-2">
          <span className="text-sm font-medium block">Profile photo</span>
          <input className={fieldClass()} value={profile.avatar_url} onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })} placeholder="Upload or paste image URL" />
          <p className="text-xs text-zinc-500">Square JPG, PNG, or WebP up to 2MB works best. Upload fills the URL; click Save to publish it.</p>
          <UploadButton
            endpoint="avatarUploader"
            onClientUploadComplete={(files) => {
              const url = files[0]?.ufsUrl ?? files[0]?.url
              if (!url) return
              setProfile((current) => ({ ...current, avatar_url: url }))
              toast.success('Profile photo uploaded')
            }}
            onUploadError={(error) => { toast.error(error.message) }}
            appearance={{ button: 'ut-ready:bg-zinc-950 ut-ready:text-white ut-ready:hover:bg-zinc-800 ut-uploading:bg-zinc-400 rounded-md px-3 text-xs font-semibold', allowedContent: 'text-xs text-zinc-500' }}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <span className="text-sm font-medium block">Cover photo</span>
          <input className={fieldClass()} value={profile.cover_photo_url} onChange={(e) => setProfile({ ...profile, cover_photo_url: e.target.value })} placeholder="Or paste cover photo URL" />
          <p className="text-xs text-zinc-500">Use a wide JPG, PNG, or WebP up to 4MB. This is optional but makes the public profile feel complete.</p>
          <UploadButton
            endpoint="coverUploader"
            onClientUploadComplete={(files) => {
              const url = files[0]?.ufsUrl ?? files[0]?.url
              if (!url) return
              setProfile((current) => ({ ...current, cover_photo_url: url }))
              toast.success('Cover photo uploaded')
            }}
            onUploadError={(error) => { toast.error(error.message) }}
            appearance={{ button: 'ut-ready:bg-zinc-950 ut-ready:text-white ut-ready:hover:bg-zinc-800 ut-uploading:bg-zinc-400 rounded-md px-3 text-xs font-semibold', allowedContent: 'text-xs text-zinc-500' }}
          />
        </div>

        <label className="space-y-1.5 sm:col-span-2"><span className="text-sm font-medium">Public bio</span><textarea rows={3} className={`${fieldClass()} h-auto py-2`} value={profile.public_bio} onChange={(e) => setProfile({ ...profile, public_bio: e.target.value })} /></label>
        <label className="space-y-1.5"><span className="text-sm font-medium">Niches</span><input className={fieldClass()} value={profile.niches} onChange={(e) => setProfile({ ...profile, niches: e.target.value })} placeholder="beauty, skincare" /></label>
        <label className="space-y-1.5"><span className="text-sm font-medium">Languages</span><input className={fieldClass()} value={profile.languages} onChange={(e) => setProfile({ ...profile, languages: e.target.value })} placeholder="Hindi, English" /></label>
        <label className="space-y-1.5"><span className="text-sm font-medium">Content styles</span><input className={fieldClass()} value={profile.content_styles} onChange={(e) => setProfile({ ...profile, content_styles: e.target.value })} /></label>
        <label className="space-y-1.5"><span className="text-sm font-medium">Audience regions</span><input className={fieldClass()} value={profile.audience_regions} onChange={(e) => setProfile({ ...profile, audience_regions: e.target.value })} /></label>
        <label className="space-y-1.5"><span className="text-sm font-medium">Followers</span><input type="number" className={fieldClass()} value={profile.follower_count} onChange={(e) => setProfile({ ...profile, follower_count: e.target.value })} /></label>
        <label className="space-y-1.5"><span className="text-sm font-medium">Engagement rate %</span><input type="number" step="0.1" className={fieldClass()} value={profile.engagement_rate} onChange={(e) => setProfile({ ...profile, engagement_rate: e.target.value })} /></label>
        <label className="space-y-1.5"><span className="text-sm font-medium">Price min INR</span><input type="number" className={fieldClass()} value={profile.price_range_min_inr} onChange={(e) => setProfile({ ...profile, price_range_min_inr: e.target.value })} /></label>
        <label className="space-y-1.5"><span className="text-sm font-medium">Price max INR</span><input type="number" className={fieldClass()} value={profile.price_range_max_inr} onChange={(e) => setProfile({ ...profile, price_range_max_inr: e.target.value })} /></label>
        <label className="space-y-1.5"><span className="text-sm font-medium">Avg reel views</span><input type="number" className={fieldClass()} value={profile.average_reel_views} onChange={(e) => setProfile({ ...profile, average_reel_views: e.target.value })} /></label>
        <label className="space-y-1.5"><span className="text-sm font-medium">Age range</span><input className={fieldClass()} value={profile.audience_age_range} onChange={(e) => setProfile({ ...profile, audience_age_range: e.target.value })} /></label>
        <label className="space-y-1.5 sm:col-span-2"><span className="text-sm font-medium">Gender skew</span><input className={fieldClass()} value={profile.audience_gender_skew} onChange={(e) => setProfile({ ...profile, audience_gender_skew: e.target.value })} /></label>
      </div>

      {/* Platforms & Stats */}
      <div className="space-y-3">
        <div className="text-sm font-semibold text-zinc-900">Platforms &amp; Stats</div>
        {PLATFORMS.map((platform) => (
          <div key={platform} className="grid gap-2 sm:grid-cols-[1fr_180px]">
            <label className="space-y-1">
              <span className="text-xs font-medium text-zinc-600">{platform} URL</span>
              <input className={fieldClass()} value={profile.platform_links[platform] ?? ''} onChange={(e) => setProfile((p) => ({ ...p, platform_links: { ...p.platform_links, [platform]: e.target.value } }))} placeholder={`https://${platform.toLowerCase()}.com/...`} />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-zinc-600">Followers</span>
              <input type="number" className={fieldClass()} value={profile.platform_follower_counts[platform] ?? ''} onChange={(e) => setProfile((p) => ({ ...p, platform_follower_counts: { ...p.platform_follower_counts, [platform]: Number(e.target.value) || 0 } }))} placeholder="0" />
            </label>
          </div>
        ))}
      </div>

      {/* Collaboration preferences */}
      <div className="space-y-4">
        <div className="text-sm font-semibold text-zinc-900">Collaboration preferences</div>
        <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
          <input type="checkbox" checked={profile.is_available} onChange={(e) => setProfile({ ...profile, is_available: e.target.checked })} className="rounded" />
          Available for campaigns
        </label>
        <div className="space-y-2">
          <div className="text-xs font-medium text-zinc-600">Collaboration types</div>
          <div className="flex flex-wrap gap-2">
            {COLLAB_TYPES.map((type) => (
              <label key={type} className="flex items-center gap-1.5 text-sm text-zinc-700 cursor-pointer">
                <input type="checkbox" checked={profile.collaboration_types.includes(type)} onChange={() => setProfile((p) => ({ ...p, collaboration_types: toggleCheckbox(p.collaboration_types, type) }))} />
                {type}
              </label>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-xs font-medium text-zinc-600">Preferred campaign types</div>
          <div className="flex flex-wrap gap-2">
            {CAMPAIGN_TYPES.map((type) => (
              <label key={type} className="flex items-center gap-1.5 text-sm text-zinc-700 cursor-pointer">
                <input type="checkbox" checked={profile.preferred_campaign_types.includes(type)} onChange={() => setProfile((p) => ({ ...p, preferred_campaign_types: toggleCheckbox(p.preferred_campaign_types, type) }))} />
                {type}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Past collaborations */}
      <div className="space-y-3">
        <div className="text-sm font-semibold text-zinc-900">Past collaborations</div>
        {profile.past_collaborations.map((collab, i) => (
          <div key={i} className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-medium">{collab.brand}</span>
                {collab.year && <span className="ml-2 text-zinc-500">{collab.year}</span>}
                {collab.type && <span className="ml-2 text-zinc-500">· {collab.type}</span>}
                {collab.description && <div className="mt-1 text-zinc-600">{collab.description}</div>}
              </div>
              <button type="button" onClick={() => removeCollab(i)} className="shrink-0 rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50">Remove</button>
            </div>
          </div>
        ))}
        {profile.past_collaborations.length >= 10 ? (
          <div className="text-xs text-zinc-500">Maximum 10 past collaborations reached.</div>
        ) : (
          <div className="grid gap-2 rounded-md border border-zinc-200 p-3 sm:grid-cols-2">
            <input className={fieldClass()} placeholder="Brand name (required)" value={collabForm.brand} onChange={(e) => setCollabForm({ ...collabForm, brand: e.target.value })} />
            <input className={fieldClass()} placeholder="Year (e.g. 2024)" value={collabForm.year ?? ''} onChange={(e) => setCollabForm({ ...collabForm, year: e.target.value })} />
            <select className={fieldClass()} value={collabForm.type ?? ''} onChange={(e) => setCollabForm({ ...collabForm, type: e.target.value })}>
              <option value="">Format</option>
              {COLLAB_FORMAT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
            <input className={fieldClass()} placeholder="Short description" value={collabForm.description ?? ''} onChange={(e) => setCollabForm({ ...collabForm, description: e.target.value })} />
            <button type="button" onClick={addCollab} className="sm:col-span-2 inline-flex h-9 items-center justify-center rounded-md bg-zinc-950 px-4 text-xs font-semibold text-white hover:bg-zinc-800">+ Add collaboration</button>
          </div>
        )}
      </div>

      {/* Save actions */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button type="button" disabled={saving} onClick={() => onSave(false)} className="inline-flex h-10 items-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 active:translate-y-px disabled:opacity-60">
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Save
        </button>
        <button type="button" onClick={() => onSave(true)} disabled={saving || completion < 75} className="h-10 rounded-md border border-zinc-950 bg-white px-4 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-950 hover:text-white active:translate-y-px disabled:cursor-not-allowed disabled:border-zinc-300 disabled:text-zinc-400 disabled:hover:bg-white">
          Submit profile for review
        </button>
      </div>
    </div>
  )
}
