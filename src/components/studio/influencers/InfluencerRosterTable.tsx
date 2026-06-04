'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Search, Eye, Pencil, MoreHorizontal, Star, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Influencer } from '@/lib/types'

export type InfluencerRow = Influencer & { campaign_count: number }

function PlatformBadge({ platform }: { platform: string | null }) {
  if (!platform) return null
  const p = platform.toLowerCase()
  const cfg = p === 'instagram' ? { label: 'IG', cls: 'bg-pink-100 text-pink-600' }
    : p === 'youtube' ? { label: 'YT', cls: 'bg-red-100 text-red-600' }
    : p === 'linkedin' ? { label: 'LI', cls: 'bg-blue-100 text-blue-700' }
    : { label: p.slice(0, 2).toUpperCase(), cls: 'bg-zinc-100 text-zinc-600' }
  return <span className={cn('inline-flex h-4 w-6 items-center justify-center rounded text-[9px] font-bold', cfg.cls)}>{cfg.label}</span>
}

function AvailBadge({ av }: { av: string | null }) {
  const a = (av || '').toLowerCase()
  if (a === 'active')
    return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Active</span>
  if (a === 'busy')
    return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" />Busy</span>
  if (a === 'unavailable')
    return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700"><span className="h-1.5 w-1.5 rounded-full bg-red-500" />Unavail.</span>
  return <span className="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500">—</span>
}

function Stars({ n }: { n: number | null }) {
  const count = Math.round(n ?? 0)
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn('h-3.5 w-3.5', i <= count ? 'fill-amber-400 text-amber-400' : 'fill-none text-zinc-300')} />
      ))}
    </div>
  )
}

function fmtFollowers(n: number | null) {
  if (n == null) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

function fmtInr(n: number | null) {
  if (n == null) return '—'
  return `₹${n.toLocaleString('en-IN')}`
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase()
}

function NicheDropdown({ selected, all, onChange }: { selected: string[]; all: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  const toggle = (n: string) => onChange(selected.includes(n) ? selected.filter((x) => x !== n) : [...selected, n])
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
      >
        {selected.length > 0
          ? <span className="font-medium text-[#7C3AED]">{selected.length} niche{selected.length > 1 ? 's' : ''}</span>
          : <span className="text-zinc-500">Niche</span>}
        <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
      </button>
      {open && (
        <div className="absolute top-full left-0 z-30 mt-1 w-52 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg">
          <div className="max-h-56 overflow-y-auto p-1">
            {all.length === 0 && <p className="px-3 py-3 text-center text-xs text-zinc-500">No niches yet</p>}
            {all.map((n) => (
              <label key={n} className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm hover:bg-zinc-50">
                <input type="checkbox" checked={selected.includes(n)} onChange={() => toggle(n)} className="h-3.5 w-3.5 accent-violet-600" />
                <span className="capitalize text-zinc-700">{n}</span>
              </label>
            ))}
          </div>
          {selected.length > 0 && (
            <div className="border-t border-zinc-100 p-2">
              <button onClick={() => onChange([])} className="w-full rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900">Clear</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ActionsMenu({ id, onDeactivate }: { id: string; onDeactivate: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((v) => !v)} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900">
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-36 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg">
          <button onClick={() => { setOpen(false); onDeactivate() }} className="flex w-full items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50">
            Deactivate
          </button>
        </div>
      )}
    </div>
  )
}

export function InfluencerRosterTable({ influencers, allCities, allNiches }: { influencers: InfluencerRow[]; allCities: string[]; allNiches: string[] }) {
  const [q, setQ] = useState('')
  const [platform, setPlatform] = useState('')
  const [niches, setNiches] = useState<string[]>([])
  const [city, setCity] = useState('')
  const [availability, setAvailability] = useState('')
  const [rating, setRating] = useState('')
  const [rows, setRows] = useState(influencers)

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase()
    return rows.filter((r) => {
      if (ql && !r.name.toLowerCase().includes(ql) && !(r.handle ?? '').toLowerCase().includes(ql)) return false
      if (platform && (r.platform ?? '').toLowerCase() !== platform.toLowerCase()) return false
      if (niches.length > 0 && !niches.some((n) => r.niches.includes(n))) return false
      if (city && r.city !== city) return false
      if (availability && r.availability !== availability) return false
      if (rating && (r.linchpin_rating ?? 0) < parseInt(rating)) return false
      return true
    })
  }, [rows, q, platform, niches, city, availability, rating])

  async function deactivate(id: string) {
    const res = await fetch(`/api/admin/influencers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: false }),
    })
    if (res.ok) { setRows((prev) => prev.filter((r) => r.id !== id)); toast.success('Influencer deactivated') }
    else toast.error('Failed to deactivate')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or @handle…" className="h-10 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm placeholder:text-zinc-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100" />
        </div>
        <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100">
          <option value="">All Platforms</option>
          <option value="Instagram">Instagram</option>
          <option value="YouTube">YouTube</option>
          <option value="LinkedIn">LinkedIn</option>
        </select>
        <NicheDropdown selected={niches} all={allNiches} onChange={setNiches} />
        <select value={city} onChange={(e) => setCity(e.target.value)} className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100">
          <option value="">All Cities</option>
          {allCities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={availability} onChange={(e) => setAvailability(e.target.value)} className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100">
          <option value="">All Availability</option>
          <option value="active">Active</option>
          <option value="busy">Busy</option>
          <option value="unavailable">Unavailable</option>
        </select>
        <select value={rating} onChange={(e) => setRating(e.target.value)} className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100">
          <option value="">All Ratings</option>
          <option value="5">5★ only</option>
          <option value="4">4★+</option>
          <option value="3">3★+</option>
        </select>
        {(q || platform || niches.length > 0 || city || availability || rating) && (
          <button onClick={() => { setQ(''); setPlatform(''); setNiches([]); setCity(''); setAvailability(''); setRating('') }} className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900">
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}
        <span className="ml-auto text-xs text-zinc-500">{filtered.length} of {rows.length}</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/60 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                <th className="px-4 py-3">Creator</th>
                <th className="px-4 py-3">Niches</th>
                <th className="px-4 py-3">City / Languages</th>
                <th className="px-4 py-3 text-right">Followers / Eng.</th>
                <th className="px-4 py-3 text-right">Rate/reel</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Campaigns</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-sm text-zinc-500">No influencers match your filters.</td></tr>
              )}
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {r.avatar_url
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={r.avatar_url} alt={r.name} className="h-9 w-9 shrink-0 rounded-full object-cover" />
                        : <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-[#7C3AED]">{initials(r.name)}</div>}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Link href={`/admin/influencers/${r.id}`} className="truncate font-medium text-zinc-900 hover:underline">{r.name}</Link>
                          <PlatformBadge platform={r.platform} />
                        </div>
                        {r.handle && <div className="text-[11px] text-zinc-500">@{r.handle}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {r.niches.slice(0, 3).map((n) => (
                        <span key={n} className="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium capitalize text-zinc-600">{n}</span>
                      ))}
                      {r.niches.length > 3 && <span className="inline-flex rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-600">+{r.niches.length - 3}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-zinc-700">{r.city || '—'}</div>
                    {r.languages.length > 0 && <div className="text-[11px] text-zinc-500">{r.languages.join(', ')}</div>}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    <div className="font-medium text-zinc-900">{fmtFollowers(r.follower_count)}</div>
                    {r.engagement_rate != null && <div className="text-[11px] text-zinc-500">{Number(r.engagement_rate).toFixed(1)}%</div>}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-zinc-900">{fmtInr(r.rate_per_reel)}</td>
                  <td className="px-4 py-3"><Stars n={r.linchpin_rating} /></td>
                  <td className="px-4 py-3"><AvailBadge av={r.availability} /></td>
                  <td className="px-4 py-3 text-right tabular-nums text-zinc-700">{r.campaign_count}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/admin/influencers/${r.id}`} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900" title="View"><Eye className="h-4 w-4" /></Link>
                      <Link href={`/admin/influencers/${r.id}?tab=edit`} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900" title="Edit"><Pencil className="h-4 w-4" /></Link>
                      <ActionsMenu id={r.id} onDeactivate={() => deactivate(r.id)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
