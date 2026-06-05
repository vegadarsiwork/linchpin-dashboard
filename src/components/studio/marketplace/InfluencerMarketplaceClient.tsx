'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, ChevronDown, Clock, Filter, Loader2, Search, Sparkles, XCircle } from 'lucide-react'
import type { Organisation, PublicInfluencer, PublicInfluencerMatch } from '@/lib/types'
import { cn } from '@/lib/utils'
import { CreatorCard } from './CreatorCard'
import { InfluencerProfileModal } from './InfluencerProfileModal'
import { InfluencerEnquiryModal } from './InfluencerEnquiryModal'

type Tab = 'explore' | 'match' | 'requests'

type RequestRow = {
  id: string
  status: string
  request_source: string
  client_notes: string | null
  admin_notes: string | null
  created_at: string
  influencer_name: string | null
  influencer_platform: string | null
  influencer_city: string | null
}

type BriefState = {
  brand_category: string
  target_audience: string
  goal: string
  format: string
  language: string
  tone: string
  budget_min: number | null
  budget_max: number | null
  timeline: string
  notes: string
}

type FilterState = {
  gender: string
  follower_tier: string
  platform: string
  city: string
  niches: string[]
  languages: string[]
  is_available: boolean | null
}

const EMPTY_BRIEF: BriefState = {
  brand_category: '', target_audience: '', goal: '', format: 'Reel',
  language: '', tone: '', budget_min: null, budget_max: null, timeline: '', notes: '',
}

const EMPTY_FILTERS: FilterState = {
  gender: '', follower_tier: '', platform: '', city: '',
  niches: [], languages: [], is_available: null,
}

const TIER_RANGES: Record<string, { min?: number; max?: number }> = {
  nano: { min: 1000, max: 10000 },
  micro: { min: 10000, max: 100000 },
  macro: { min: 100000, max: 1000000 },
  mega: { min: 1000000 },
}

const STATUS_META: Record<string, { label: string; icon: typeof Clock; cls: string }> = {
  requested: { label: 'Requested', icon: Clock, cls: 'bg-amber-100 text-amber-800' },
  under_review: { label: 'Under review', icon: Clock, cls: 'bg-violet-100 text-violet-800' },
  confirmed: { label: 'Confirmed', icon: CheckCircle2, cls: 'bg-emerald-100 text-emerald-800' },
  unavailable: { label: 'Unavailable', icon: XCircle, cls: 'bg-red-100 text-red-800' },
  script_ready: { label: 'Script ready', icon: CheckCircle2, cls: 'bg-cyan-100 text-cyan-800' },
  in_production: { label: 'In production', icon: Clock, cls: 'bg-blue-100 text-blue-800' },
  delivered: { label: 'Delivered', icon: CheckCircle2, cls: 'bg-zinc-100 text-zinc-700' },
}

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? STATUS_META.requested
  const Icon = meta.icon
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold', meta.cls)}>
      <Icon className="h-3 w-3" /> {meta.label}
    </span>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1">
      <span className="app-subtle block text-xs font-medium">{label}</span>
      {children}
    </label>
  )
}

function inputCls() { return 'app-input h-10 w-full rounded-md px-3 text-sm' }

async function readJson(res: Response) {
  const text = await res.text()
  if (!text) return {}
  try { return JSON.parse(text) as Record<string, unknown> }
  catch { return { error: text.slice(0, 180) || `Request failed with ${res.status}` } }
}

function buildParams(q: string, filters: FilterState) {
  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (filters.gender) params.set('gender', filters.gender)
  if (filters.platform) params.set('platform', filters.platform)
  if (filters.city) params.set('city', filters.city)
  if (filters.niches.length) params.set('niches', filters.niches.join(','))
  if (filters.languages.length) params.set('languages', filters.languages.join(','))
  if (filters.is_available) params.set('is_available', 'true')
  if (filters.follower_tier && TIER_RANGES[filters.follower_tier]) {
    const tier = TIER_RANGES[filters.follower_tier]
    if (tier.min != null) params.set('follower_min', String(tier.min))
    if (tier.max != null) params.set('follower_max', String(tier.max))
  }
  return params
}

export function InfluencerMarketplaceClient({ org }: { org: Organisation | null }) {
  const [tab, setTab] = useState<Tab>('explore')
  const [creators, setCreators] = useState<PublicInfluencer[]>([])
  const [featured, setFeatured] = useState<PublicInfluencer[]>([])
  const [requests, setRequests] = useState<RequestRow[]>([])
  const [matches, setMatches] = useState<PublicInfluencerMatch[]>([])
  const [matchRequestId, setMatchRequestId] = useState<string | null>(null)
  const [loadingCreators, setLoadingCreators] = useState(true)
  const [matching, setMatching] = useState(false)
  const [q, setQ] = useState('')
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [profileTarget, setProfileTarget] = useState<PublicInfluencer | null>(null)
  const [enquiryTarget, setEnquiryTarget] = useState<PublicInfluencer | null>(null)
  const [enquiryMatch, setEnquiryMatch] = useState<PublicInfluencerMatch | undefined>(undefined)
  const [brief, setBrief] = useState<BriefState>(() => ({
    ...EMPTY_BRIEF,
    brand_category: org?.brand_category ?? '',
    target_audience: org?.target_audience ?? '',
    tone: org?.brand_tone ?? '',
  }))
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const availableNiches = useMemo(() => [...new Set(creators.flatMap((c) => c.niches))].slice(0, 15), [creators])
  const availableLanguages = useMemo(() => [...new Set(creators.flatMap((c) => c.languages))].slice(0, 10), [creators])

  const loadCreators = useCallback(async (searchQ: string, searchFilters: FilterState) => {
    setLoadingCreators(true)
    const params = buildParams(searchQ, searchFilters)
    const res = await fetch(`/api/influencers?${params.toString()}`)
    const json = await readJson(res)
    if (res.ok) {
      setCreators((json.influencers as PublicInfluencer[]) ?? [])
      setFeatured((json.featured as PublicInfluencer[]) ?? [])
    } else {
      toast.error(String(json.error ?? 'Failed to load creators'))
    }
    setLoadingCreators(false)
  }, [])

  async function loadRequests() {
    const res = await fetch('/api/influencer-requests')
    const json = await readJson(res)
    if (res.ok) setRequests((json.requests as RequestRow[]) ?? [])
    else toast.error(String(json.error ?? 'Failed to load requests'))
  }

  useEffect(() => {
    loadCreators(q, filters)
    loadRequests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { loadCreators(q, filters) }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, filters.gender, filters.follower_tier, filters.platform, filters.city, filters.niches, filters.languages, filters.is_available])

  function setFilter<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    setFilters((f) => ({ ...f, [key]: value }))
  }
  function toggleNiche(niche: string) {
    setFilter('niches', filters.niches.includes(niche) ? filters.niches.filter((n) => n !== niche) : [...filters.niches, niche])
  }
  function toggleLanguage(lang: string) {
    setFilter('languages', filters.languages.includes(lang) ? filters.languages.filter((l) => l !== lang) : [...filters.languages, lang])
  }
  function clearFilters() { setQ(''); setFilters(EMPTY_FILTERS) }

  function requestCreator(influencer: PublicInfluencer, match?: PublicInfluencerMatch) {
    setEnquiryTarget(influencer)
    setEnquiryMatch(match)
  }
  function openProfile(influencer: PublicInfluencer) { setProfileTarget(influencer) }

  async function findMatches() {
    setMatching(true)
    setMatches([])
    const res = await fetch('/api/influencer-match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(brief),
    })
    const json = await readJson(res)
    setMatching(false)
    if (!res.ok) { toast.error(String(json.error ?? 'Could not find matches')); return }
    setMatches((json.matches as PublicInfluencerMatch[]) ?? [])
    setMatchRequestId((json.match_request_id as string | null) ?? null)
  }

  function setBriefField<K extends keyof BriefState>(key: K, value: BriefState[K]) {
    setBrief((c) => ({ ...c, [key]: value }))
  }

  const activeFilterCount = [filters.gender, filters.follower_tier, filters.platform, filters.city, filters.is_available]
    .filter(Boolean).length + filters.niches.length + filters.languages.length

  return (
    <div className="space-y-5">
      <div className="app-panel rounded-lg p-5">
        <div className="max-w-3xl">
          <div className="app-accent text-xs font-semibold uppercase tracking-[0.18em]">Managed creator marketplace</div>
          <h2 className="app-heading mt-2 text-2xl font-semibold tracking-tight">Browse trial reels, request through Linchpin.</h2>
          <p className="app-subtle mt-2 text-sm leading-6">
            Creator contact details stay private. Your Studio team confirms availability, pricing, scripting, and delivery inside the platform.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {([['explore', 'Explore Creators'], ['match', 'Find My Best Matches'], ['requests', 'My Requests']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} className={cn('rounded-md px-3 py-2 text-sm font-medium', tab === key ? 'bg-violet-600 text-white' : 'app-nav-item ring-1 ring-zinc-200')}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'explore' && (
        <section className="space-y-4">
          {featured.length > 0 && (
            <div className="space-y-2">
              <div className="app-accent text-xs font-semibold uppercase tracking-widest">Featured creators</div>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {featured.map((creator) => (
                  <CreatorCard key={creator.id} influencer={creator} onRequest={requestCreator} onView={openProfile} compact />
                ))}
              </div>
            </div>
          )}

          <div className="app-panel rounded-lg p-3 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[220px] flex-1">
                <Search className="app-subtle absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search creators" className={`${inputCls()} pl-9`} />
              </div>
              <button onClick={() => setFiltersOpen((o) => !o)} className={cn('flex h-10 items-center gap-1.5 rounded-md px-3 text-sm font-medium ring-1 ring-zinc-200 app-nav-item', filtersOpen && 'ring-violet-500')}>
                <Filter className="h-4 w-4" /> Filters
                {activeFilterCount > 0 && <span className="ml-1 rounded-full bg-violet-600 px-1.5 text-[10px] font-bold text-white">{activeFilterCount}</span>}
                <ChevronDown className={cn('h-3 w-3 transition-transform', filtersOpen && 'rotate-180')} />
              </button>
              {activeFilterCount > 0 && <button onClick={clearFilters} className="app-subtle text-xs hover:underline">Clear all</button>}
            </div>

            {filtersOpen && (
              <div className="space-y-4 border-t border-zinc-200 pt-3">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  <Field label="Gender">
                    <select className={inputCls()} value={filters.gender} onChange={(e) => setFilter('gender', e.target.value)}>
                      <option value="">Any</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Non-binary">Non-binary</option>
                    </select>
                  </Field>
                  <Field label="Follower tier">
                    <select className={inputCls()} value={filters.follower_tier} onChange={(e) => setFilter('follower_tier', e.target.value)}>
                      <option value="">Any</option>
                      <option value="nano">Nano (1K-10K)</option>
                      <option value="micro">Micro (10K-100K)</option>
                      <option value="macro">Macro (100K-1M)</option>
                      <option value="mega">Mega (1M+)</option>
                    </select>
                  </Field>
                  <Field label="Platform">
                    <select className={inputCls()} value={filters.platform} onChange={(e) => setFilter('platform', e.target.value)}>
                      <option value="">Any</option>
                      <option value="Instagram">Instagram</option>
                      <option value="YouTube">YouTube</option>
                      <option value="Twitter">Twitter</option>
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="TikTok">TikTok</option>
                    </select>
                  </Field>
                  <Field label="City">
                    <input className={inputCls()} value={filters.city} onChange={(e) => setFilter('city', e.target.value)} placeholder="e.g. Mumbai" />
                  </Field>
                </div>
                {availableNiches.length > 0 && (
                  <div>
                    <div className="app-subtle mb-1.5 text-xs font-medium">Niches</div>
                    <div className="flex flex-wrap gap-1.5">
                      {availableNiches.map((niche) => (
                        <label key={niche} className="flex cursor-pointer items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] capitalize transition-colors" style={{ borderColor: filters.niches.includes(niche) ? '#7c3aed' : undefined, color: filters.niches.includes(niche) ? '#7c3aed' : undefined }}>
                          <input type="checkbox" className="sr-only" checked={filters.niches.includes(niche)} onChange={() => toggleNiche(niche)} />
                          {niche}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                {availableLanguages.length > 0 && (
                  <div>
                    <div className="app-subtle mb-1.5 text-xs font-medium">Languages</div>
                    <div className="flex flex-wrap gap-1.5">
                      {availableLanguages.map((lang) => (
                        <label key={lang} className="flex cursor-pointer items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition-colors" style={{ borderColor: filters.languages.includes(lang) ? '#7c3aed' : undefined, color: filters.languages.includes(lang) ? '#7c3aed' : undefined }}>
                          <input type="checkbox" className="sr-only" checked={filters.languages.includes(lang)} onChange={() => toggleLanguage(lang)} />
                          {lang}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" checked={filters.is_available === true} onChange={(e) => setFilter('is_available', e.target.checked ? true : null)} className="h-4 w-4 rounded border-zinc-300 accent-violet-600" />
                  <span className="app-subtle text-xs">Available creators only</span>
                </label>
              </div>
            )}
          </div>

          {loadingCreators ? (
            <div className="app-panel flex h-48 items-center justify-center rounded-lg"><Loader2 className="app-accent h-5 w-5 animate-spin" /></div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {creators.map((creator) => <CreatorCard key={creator.id} influencer={creator} onRequest={requestCreator} onView={openProfile} />)}
              {creators.length === 0 && (
                <div className="app-subtle col-span-full rounded-lg border border-dashed border-zinc-300 p-10 text-center text-sm">No creators match your filters.</div>
              )}
            </div>
          )}
        </section>
      )}

      {tab === 'match' && (
        <section className="grid gap-5 lg:grid-cols-[380px_1fr]">
          <div className="app-panel rounded-lg p-4">
            <div className="app-heading mb-4 flex items-center gap-2 text-sm font-semibold"><Sparkles className="app-accent h-4 w-4" /> Campaign brief</div>
            <div className="space-y-3">
              <Field label="Brand category"><input className={inputCls()} value={brief.brand_category} onChange={(e) => setBriefField('brand_category', e.target.value)} /></Field>
              <Field label="Target audience"><input className={inputCls()} value={brief.target_audience} onChange={(e) => setBriefField('target_audience', e.target.value)} /></Field>
              <Field label="Goal"><input className={inputCls()} placeholder="Awareness, leads, launch" value={brief.goal} onChange={(e) => setBriefField('goal', e.target.value)} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Format"><input className={inputCls()} value={brief.format} onChange={(e) => setBriefField('format', e.target.value)} /></Field>
                <Field label="Language"><input className={inputCls()} value={brief.language} onChange={(e) => setBriefField('language', e.target.value)} /></Field>
                <Field label="Budget min"><input type="number" className={inputCls()} value={brief.budget_min ?? ''} onChange={(e) => setBriefField('budget_min', e.target.value ? Number(e.target.value) : null)} /></Field>
                <Field label="Budget max"><input type="number" className={inputCls()} value={brief.budget_max ?? ''} onChange={(e) => setBriefField('budget_max', e.target.value ? Number(e.target.value) : null)} /></Field>
              </div>
              <Field label="Tone"><input className={inputCls()} value={brief.tone} onChange={(e) => setBriefField('tone', e.target.value)} /></Field>
              <Field label="Timeline"><input className={inputCls()} value={brief.timeline} onChange={(e) => setBriefField('timeline', e.target.value)} /></Field>
              <Field label="Notes"><textarea rows={3} className={`${inputCls()} h-auto py-2`} value={brief.notes} onChange={(e) => setBriefField('notes', e.target.value)} /></Field>
              <button onClick={findMatches} disabled={matching} className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-violet-600 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60">
                {matching && <Loader2 className="h-4 w-4 animate-spin" />} Find matches
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {matching && <div className="app-panel app-subtle flex h-48 items-center justify-center rounded-lg text-sm">Scoring creator tags...</div>}
            {!matching && matches.length === 0 && <div className="app-subtle rounded-lg border border-dashed border-zinc-300 p-10 text-center text-sm">Submit a brief to get ranked creators.</div>}
            {matches.map((match) => <CreatorCard key={match.influencer_id} influencer={match.influencer} match={match} onRequest={requestCreator} onView={openProfile} />)}
          </div>
        </section>
      )}

      {tab === 'requests' && (
        <section className="space-y-3">
          {requests.map((request) => (
            <div key={request.id} className="app-panel flex flex-wrap items-center justify-between gap-3 rounded-lg p-4">
              <div>
                <div className="app-heading text-sm font-semibold">{request.influencer_name ?? 'Creator request'}</div>
                <div className="app-subtle mt-1 text-xs">{request.influencer_platform ?? 'Creator'} - {new Date(request.created_at).toLocaleDateString('en-IN')}</div>
                {request.admin_notes && <div className="app-subtle mt-2 text-xs">{request.admin_notes}</div>}
              </div>
              <StatusBadge status={request.status} />
            </div>
          ))}
          {requests.length === 0 && <div className="app-subtle rounded-lg border border-dashed border-zinc-300 p-10 text-center text-sm">No creator requests yet.</div>}
        </section>
      )}

      {profileTarget && <InfluencerProfileModal influencer={profileTarget} onClose={() => setProfileTarget(null)} />}
      {enquiryTarget && (
        <InfluencerEnquiryModal
          influencer={enquiryTarget}
          matchRequestId={enquiryMatch ? matchRequestId : null}
          requestSource={enquiryMatch ? 'match' : 'browse'}
          onClose={() => { setEnquiryTarget(null); setEnquiryMatch(undefined) }}
          onSuccess={loadRequests}
        />
      )}
    </div>
  )
}
