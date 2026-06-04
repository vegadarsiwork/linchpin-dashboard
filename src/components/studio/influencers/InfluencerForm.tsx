'use client'

import { useState, useMemo } from 'react'
import type { ReactNode, KeyboardEvent, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Star, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Influencer } from '@/lib/types'

const NICHE_SUGGESTIONS = ['skincare', 'fitness', 'food', 'lifestyle', 'tech', 'finance', 'fashion', 'parenting', 'travel', 'comedy', 'education', 'gaming']
const LANG_SUGGESTIONS = ['Hindi', 'English', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Marathi', 'Bengali', 'Gujarati', 'Punjabi']
const CONTENT_STYLES = ['Talking head', 'Cinematic', 'POV', 'Educational', 'Entertaining', 'Aesthetic', 'Raw & Real', 'Tutorial']

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-zinc-700">{label}</label>
      {children}
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5">
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{title}</h2>
      {children}
    </div>
  )
}

function inputCls(extra = '') {
  return cn('h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100', extra)
}

function TagInput({ value, onChange, placeholder, suggestions = [] }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string; suggestions?: string[] }) {
  const [input, setInput] = useState('')
  const [show, setShow] = useState(false)
  const filtered = useMemo(() => {
    const q = input.trim().toLowerCase()
    if (!q) return []
    return suggestions.filter((s) => s.toLowerCase().includes(q) && !value.map((v) => v.toLowerCase()).includes(s.toLowerCase()))
  }, [input, suggestions, value])

  function add(tag: string) {
    const t = tag.trim()
    if (t && !value.map((v) => v.toLowerCase()).includes(t.toLowerCase())) onChange([...value, t])
    setInput(''); setShow(false)
  }
  function remove(tag: string) { onChange(value.filter((v) => v !== tag)) }
  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) { e.preventDefault(); add(input) }
    if (e.key === 'Backspace' && !input && value.length > 0) remove(value[value.length - 1])
  }

  return (
    <div className="relative">
      <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-zinc-200 bg-white p-2 focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100">
        {value.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700">
            <span className="capitalize">{t}</span>
            <button type="button" onClick={() => remove(t)} className="text-violet-400 hover:text-violet-700"><X className="h-3 w-3" /></button>
          </span>
        ))}
        <input value={input} onChange={(e) => { setInput(e.target.value); setShow(true) }} onKeyDown={onKey} onBlur={() => setTimeout(() => setShow(false), 150)} placeholder={value.length === 0 ? placeholder : ''} className="min-w-[100px] flex-1 border-none bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none" />
      </div>
      {show && filtered.length > 0 && (
        <div className="absolute top-full left-0 z-20 mt-1 w-full overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg">
          {filtered.slice(0, 6).map((s) => (
            <button key={s} type="button" onMouseDown={() => add(s)} className="flex w-full items-center px-3 py-2 text-sm capitalize text-zinc-700 hover:bg-violet-50 hover:text-violet-700">{s}</button>
          ))}
        </div>
      )}
    </div>
  )
}

function StarSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" onClick={() => onChange(i)} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)} className="p-0.5">
          <Star className={cn('h-6 w-6 transition-colors', i <= (hover || value) ? 'fill-amber-400 text-amber-400' : 'fill-none text-zinc-300')} />
        </button>
      ))}
      {value > 0 && <span className="ml-1 text-sm text-zinc-500">{value}/5</span>}
    </div>
  )
}

function buildProfileUrl(platform: string, handle: string) {
  const h = handle.trim().replace(/^@/, '')
  if (!h) return ''
  if (platform === 'Instagram') return `https://instagram.com/${h}`
  if (platform === 'YouTube') return `https://youtube.com/@${h}`
  if (platform === 'LinkedIn') return `https://linkedin.com/in/${h}`
  return ''
}

export interface InfluencerFormProps {
  initial?: Influencer | null
  influencerId?: string
  onSaved?: () => void
}

export function InfluencerForm({ initial, influencerId, onSaved }: InfluencerFormProps) {
  const router = useRouter()
  const isEdit = !!influencerId

  const [name, setName] = useState(initial?.name ?? '')
  const [handle, setHandle] = useState(initial?.handle ?? '')
  const [platform, setPlatform] = useState(initial?.platform ?? '')
  const [profileUrl, setProfileUrl] = useState(initial?.profile_url ?? '')
  const [avatarUrl, setAvatarUrl] = useState(initial?.avatar_url ?? '')
  const [city, setCity] = useState(initial?.city ?? '')
  const [audienceRegions, setAudienceRegions] = useState<string[]>(initial?.audience_regions ?? [])
  const [niches, setNiches] = useState<string[]>(initial?.niches ?? [])
  const [contentStyles, setContentStyles] = useState<string[]>(initial?.content_styles ?? [])
  const [languages, setLanguages] = useState<string[]>(initial?.languages ?? [])
  const [audienceNotes, setAudienceNotes] = useState(initial?.audience_notes ?? '')
  const [followerCount, setFollowerCount] = useState(initial?.follower_count?.toString() ?? '')
  const [engagementRate, setEngagementRate] = useState(initial?.engagement_rate?.toString() ?? '')
  const [ratePerReel, setRatePerReel] = useState(initial?.rate_per_reel?.toString() ?? '')
  const [ratePerStory, setRatePerStory] = useState(initial?.rate_per_story?.toString() ?? '')
  const [rating, setRating] = useState(initial?.linchpin_rating ?? 0)
  const [pastCategories, setPastCategories] = useState<string[]>(initial?.past_brand_categories ?? [])
  const [avoidCategories, setAvoidCategories] = useState<string[]>(initial?.avoid_categories ?? [])
  const [competitorBrands, setCompetitorBrands] = useState<string[]>(initial?.competitor_brands ?? [])
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [availability, setAvailability] = useState(initial?.availability ?? 'active')
  const [publicVisible, setPublicVisible] = useState(initial?.public_visible ?? false)
  const [publicBio, setPublicBio] = useState(initial?.public_bio ?? '')
  const [priceMin, setPriceMin] = useState(initial?.price_range_min_inr?.toString() ?? '')
  const [priceMax, setPriceMax] = useState(initial?.price_range_max_inr?.toString() ?? '')
  const [sampleUrls, setSampleUrls] = useState<string[]>(initial?.sample_content_urls ?? [])
  const [averageReelViews, setAverageReelViews] = useState(initial?.average_reel_views?.toString() ?? '')
  const [audienceAgeRange, setAudienceAgeRange] = useState(initial?.audience_age_range ?? '')
  const [audienceGenderSkew, setAudienceGenderSkew] = useState(initial?.audience_gender_skew ?? '')
  const [saving, setSaving] = useState(false)

  function handleHandleChange(v: string) {
    setHandle(v)
    if (!isEdit || !profileUrl) {
      setProfileUrl(buildProfileUrl(platform, v))
    }
  }
  function handlePlatformChange(v: string) {
    setPlatform(v)
    if (handle) setProfileUrl(buildProfileUrl(v, handle))
  }
  function toggleStyle(s: string) {
    setContentStyles((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) { toast.error('Name is required'); return }
    setSaving(true)
    const payload = {
      name: name.trim(),
      handle: handle.trim() || null,
      platform: platform || null,
      profile_url: profileUrl || null,
      avatar_url: avatarUrl || null,
      city: city || null,
      audience_regions: audienceRegions,
      niches,
      content_styles: contentStyles,
      languages,
      audience_notes: audienceNotes || null,
      follower_count: followerCount ? parseInt(followerCount) : null,
      engagement_rate: engagementRate ? parseFloat(engagementRate) : null,
      rate_per_reel: ratePerReel ? parseInt(ratePerReel) : null,
      rate_per_story: ratePerStory ? parseInt(ratePerStory) : null,
      linchpin_rating: rating || null,
      past_brand_categories: pastCategories,
      avoid_categories: avoidCategories,
      competitor_brands: competitorBrands,
      notes: notes || null,
      public_visible: publicVisible,
      public_bio: publicBio || null,
      price_range_min_inr: priceMin ? parseInt(priceMin) : null,
      price_range_max_inr: priceMax ? parseInt(priceMax) : null,
      sample_content_urls: sampleUrls,
      average_reel_views: averageReelViews ? parseInt(averageReelViews) : null,
      audience_age_range: audienceAgeRange || null,
      audience_gender_skew: audienceGenderSkew || null,
      availability,
    }
    try {
      const url = isEdit ? `/api/admin/influencers/${influencerId}` : '/api/admin/influencers'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? 'Failed to save'); return }
      toast.success(isEdit ? 'Influencer updated' : 'Influencer added')
      if (onSaved) onSaved()
      else router.push(`/admin/influencers/${json.influencer.id}`)
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Section title="Profile">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Full name *"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Priya Sharma" className={inputCls()} /></Field>
          <Field label="Handle (no @)"><input value={handle} onChange={(e) => handleHandleChange(e.target.value)} placeholder="priyasharma" className={inputCls()} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Platform">
            <select value={platform} onChange={(e) => handlePlatformChange(e.target.value)} className={inputCls()}>
              <option value="">Select platform</option>
              <option value="Instagram">Instagram</option>
              <option value="YouTube">YouTube</option>
              <option value="LinkedIn">LinkedIn</option>
            </select>
          </Field>
          <Field label="City"><input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Mumbai" className={inputCls()} /></Field>
        </div>
        <Field label="Profile URL"><input value={profileUrl} onChange={(e) => setProfileUrl(e.target.value)} placeholder="Auto-filled from handle" className={inputCls()} /></Field>
        <Field label="Avatar URL"><input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." className={inputCls()} /></Field>
        <Field label="Audience regions (press Enter)"><TagInput value={audienceRegions} onChange={setAudienceRegions} placeholder="Mumbai, Delhi…" /></Field>
      </Section>

      <Section title="Content">
        <Field label="Niches"><TagInput value={niches} onChange={setNiches} placeholder="Type to add…" suggestions={NICHE_SUGGESTIONS} /></Field>
        <Field label="Content styles">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {CONTENT_STYLES.map((s) => (
              <label key={s} className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700">
                <input type="checkbox" checked={contentStyles.includes(s)} onChange={() => toggleStyle(s)} className="h-4 w-4 rounded border-zinc-300 accent-violet-600" />
                {s}
              </label>
            ))}
          </div>
        </Field>
        <Field label="Languages"><TagInput value={languages} onChange={setLanguages} placeholder="Hindi, English…" suggestions={LANG_SUGGESTIONS} /></Field>
        <Field label="Audience notes">
          <textarea value={audienceNotes} onChange={(e) => setAudienceNotes(e.target.value)} placeholder="Who follows them? Be specific about demographics." rows={3} className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm placeholder:text-zinc-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100" />
        </Field>
      </Section>

      <Section title="Performance">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Follower count"><input type="number" value={followerCount} onChange={(e) => setFollowerCount(e.target.value)} placeholder="250000" className={inputCls()} /></Field>
          <Field label="Engagement rate %"><input type="number" step="0.1" value={engagementRate} onChange={(e) => setEngagementRate(e.target.value)} placeholder="4.5" className={inputCls()} /></Field>
          <Field label="Rate per reel ₹"><input type="number" value={ratePerReel} onChange={(e) => setRatePerReel(e.target.value)} placeholder="15000" className={inputCls()} /></Field>
          <Field label="Rate per story ₹"><input type="number" value={ratePerStory} onChange={(e) => setRatePerStory(e.target.value)} placeholder="5000" className={inputCls()} /></Field>
        </div>
        <Field label="Linchpin rating"><StarSelector value={rating} onChange={setRating} /></Field>
      </Section>

      <Section title="History">
        <Field label="Past brand categories"><TagInput value={pastCategories} onChange={setPastCategories} placeholder="FMCG, Fashion…" /></Field>
        <Field label="Avoid categories"><TagInput value={avoidCategories} onChange={setAvoidCategories} placeholder="Alcohol, Politics…" /></Field>
        <Field label="Competitor brands worked with"><TagInput value={competitorBrands} onChange={setCompetitorBrands} placeholder="Brand A, Brand B…" /></Field>
        <Field label="Internal notes">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal notes — not client-facing." rows={3} className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm placeholder:text-zinc-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100" />
        </Field>
      </Section>

      <Section title="Client marketplace">
        <label className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
          <input
            type="checkbox"
            checked={publicVisible}
            onChange={(e) => setPublicVisible(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-zinc-300 accent-violet-600"
          />
          <span>
            <span className="block text-sm font-medium text-zinc-900">Show to clients</span>
            <span className="block text-xs text-zinc-500">Only client-safe fields are exposed in the marketplace API.</span>
          </span>
        </label>
        <Field label="Public bio">
          <textarea value={publicBio} onChange={(e) => setPublicBio(e.target.value)} placeholder="Short client-facing creator description." rows={3} className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm placeholder:text-zinc-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Public price min INR"><input type="number" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} placeholder="10000" className={inputCls()} /></Field>
          <Field label="Public price max INR"><input type="number" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} placeholder="25000" className={inputCls()} /></Field>
          <Field label="Average reel views"><input type="number" value={averageReelViews} onChange={(e) => setAverageReelViews(e.target.value)} placeholder="85000" className={inputCls()} /></Field>
          <Field label="Audience age range"><input value={audienceAgeRange} onChange={(e) => setAudienceAgeRange(e.target.value)} placeholder="18-34" className={inputCls()} /></Field>
        </div>
        <Field label="Audience gender skew"><input value={audienceGenderSkew} onChange={(e) => setAudienceGenderSkew(e.target.value)} placeholder="70% women, 30% men" className={inputCls()} /></Field>
        <Field label="Sample content URLs"><TagInput value={sampleUrls} onChange={setSampleUrls} placeholder="Paste reel links and press Enter" /></Field>
      </Section>

      <Section title="Availability">
        <div className="flex gap-3">
          {(['active', 'busy', 'unavailable'] as const).map((a) => (
            <label key={a} className={cn('flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium capitalize transition-colors', availability === a ? 'border-violet-400 bg-violet-50 text-violet-700' : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50')}>
              <input type="radio" name="availability" value={a} checked={availability === a} onChange={() => setAvailability(a)} className="sr-only" />
              {a}
            </label>
          ))}
        </div>
      </Section>

      <div className="flex items-center justify-end gap-3">
        {isEdit && onSaved && (
          <button type="button" onClick={onSaved} className="h-10 rounded-lg border border-zinc-200 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50">Cancel</button>
        )}
        <button type="submit" disabled={saving} className="h-10 rounded-lg bg-[#7C3AED] px-5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#6D28D9] disabled:opacity-60">
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Save Influencer'}
        </button>
      </div>
    </form>
  )
}
