'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Influencer, InfluencerCampaign } from '@/lib/types'
import { InfluencerForm } from './InfluencerForm'
import { LogCampaignSlideOver } from './LogCampaignSlideOver'

type CampaignWithOrg = InfluencerCampaign & { organisations: { name: string } | null }
interface OrgOption { id: string; name: string }

function fmtFollowers(n: number | null) {
  if (n == null) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}
function fmtInr(n: number | null) { return n == null ? '—' : `₹${n.toLocaleString('en-IN')}` }
function initials(name: string) {
  const p = name.trim().split(/\s+/)
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase()
}

function PlatformBadge({ platform }: { platform: string | null }) {
  if (!platform) return null
  const p = platform.toLowerCase()
  const cfg = p === 'instagram' ? { label: 'IG', cls: 'bg-pink-100 text-pink-600' }
    : p === 'youtube' ? { label: 'YT', cls: 'bg-red-100 text-red-600' }
    : p === 'linkedin' ? { label: 'LI', cls: 'bg-blue-100 text-blue-700' }
    : { label: p.slice(0, 2).toUpperCase(), cls: 'bg-zinc-100 text-zinc-600' }
  return <span className={cn('inline-flex h-5 w-7 items-center justify-center rounded text-[9px] font-bold', cfg.cls)}>{cfg.label}</span>
}

function AvailBadge({ av }: { av: string | null }) {
  const a = (av || '').toLowerCase()
  const cfg = a === 'active' ? { cls: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', label: 'Active' }
    : a === 'busy' ? { cls: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', label: 'Busy' }
    : a === 'unavailable' ? { cls: 'bg-red-100 text-red-700', dot: 'bg-red-500', label: 'Unavailable' }
    : { cls: 'bg-zinc-100 text-zinc-500', dot: 'bg-zinc-400', label: av || '—' }
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', cfg.cls)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />{cfg.label}
    </span>
  )
}

function ProfileCard({ inf, onEdit }: { inf: Influencer; onEdit: () => void }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white">
      <div className="space-y-4 p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          {inf.avatar_url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={inf.avatar_url} alt={inf.name} className="h-20 w-20 rounded-full object-cover ring-2 ring-zinc-200" />
            : <div className="flex h-20 w-20 items-center justify-center rounded-full bg-violet-100 text-2xl font-bold text-[#7C3AED]">{initials(inf.name)}</div>}
          <div>
            <div className="text-xl font-semibold text-zinc-900">{inf.name}</div>
            {inf.handle && <div className="text-sm text-zinc-500">@{inf.handle}</div>}
            <div className="mt-1.5 flex items-center justify-center gap-1.5 text-sm text-zinc-500">
              <PlatformBadge platform={inf.platform} />
              {inf.platform && <span>{inf.platform}</span>}
              {inf.city && <><span>·</span><span>{inf.city}</span></>}
            </div>
          </div>
          <AvailBadge av={inf.availability} />
        </div>
        {inf.niches.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5">
            {inf.niches.map((n) => <span key={n} className="inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium capitalize text-zinc-600">{n}</span>)}
          </div>
        )}
        {inf.content_styles.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5">
            {inf.content_styles.map((s) => <span key={s} className="inline-flex rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-600">{s}</span>)}
          </div>
        )}
      </div>
      <div className="space-y-2.5 border-t border-zinc-100 p-4 text-sm">
        {[
          { label: 'Followers', value: fmtFollowers(inf.follower_count) },
          { label: 'Engagement', value: inf.engagement_rate != null ? `${Number(inf.engagement_rate).toFixed(1)}%` : '—' },
          { label: 'Rate/reel', value: fmtInr(inf.rate_per_reel) },
        ].map((s) => (
          <div key={s.label} className="flex items-center justify-between">
            <span className="text-zinc-500">{s.label}</span>
            <span className="font-medium tabular-nums text-zinc-900">{s.value}</span>
          </div>
        ))}
        <div className="flex items-center justify-between">
          <span className="text-zinc-500">Rating</span>
          <div className="flex gap-0.5">
            {[1,2,3,4,5].map((i) => <Star key={i} className={cn('h-4 w-4', i <= Math.round(inf.linchpin_rating ?? 0) ? 'fill-amber-400 text-amber-400' : 'fill-none text-zinc-300')} />)}
          </div>
        </div>
        {inf.languages.length > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Languages</span>
            <span className="text-right text-zinc-700">{inf.languages.join(', ')}</span>
          </div>
        )}
      </div>
      <div className="border-t border-zinc-100 p-4 space-y-2">
        <button onClick={onEdit} className="h-9 w-full rounded-lg border border-zinc-200 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50">Edit Profile</button>
        {inf.profile_url && (
          <a href={inf.profile_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center text-xs text-violet-600 hover:underline">View profile ↗</a>
        )}
      </div>
    </div>
  )
}

function CampaignHistoryTab({ campaigns, onLog }: { campaigns: CampaignWithOrg[]; onLog: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-500">{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}</span>
        <button onClick={onLog} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#7C3AED] px-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#6D28D9]">
          <Plus className="h-3.5 w-3.5" /> Log Campaign
        </button>
      </div>
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/60 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                {['Client', 'Category', 'Goal', 'Platform', 'Went live', 'Views', 'Eng.', 'Team ★', 'Client ★'].map((h) => (
                  <th key={h} className="px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 && <tr><td colSpan={9} className="px-4 py-12 text-center text-sm text-zinc-500">No campaigns logged yet.</td></tr>}
              {campaigns.map((c) => (
                <tr key={c.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/60">
                  <td className="px-4 py-3 font-medium text-zinc-900">{c.organisations?.name ?? '—'}</td>
                  <td className="px-4 py-3 capitalize text-zinc-700">{c.brand_category ?? '—'}</td>
                  <td className="px-4 py-3 text-zinc-700">{c.campaign_goal ?? '—'}</td>
                  <td className="px-4 py-3 text-zinc-700">{c.platform ?? '—'}</td>
                  <td className="px-4 py-3 text-zinc-500">{c.went_live_at ? new Date(c.went_live_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                  <td className="px-4 py-3 tabular-nums text-zinc-700">{c.views ? c.views.toLocaleString() : '—'}</td>
                  <td className="px-4 py-3 tabular-nums text-zinc-700">{c.engagement_rate != null ? `${Number(c.engagement_rate).toFixed(1)}%` : '—'}</td>
                  <td className="px-4 py-3 tabular-nums text-zinc-700">{c.team_rating ?? '—'}</td>
                  <td className="px-4 py-3 tabular-nums text-zinc-700">{c.client_rating ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function PerformanceSummaryTab({ campaigns }: { campaigns: CampaignWithOrg[] }) {
  const total = campaigns.length
  const withEng = campaigns.filter((c) => c.engagement_rate != null)
  const avgEng = withEng.length > 0 ? withEng.reduce((s, c) => s + (c.engagement_rate ?? 0), 0) / withEng.length : 0
  const totalViews = campaigns.reduce((s, c) => s + (c.views ?? 0), 0)
  const totalLeads = campaigns.reduce((s, c) => s + (c.leads_generated ?? 0), 0)
  const teamRated = campaigns.filter((c) => c.team_rating != null)
  const avgTeam = teamRated.length > 0 ? teamRated.reduce((s, c) => s + (c.team_rating ?? 0), 0) / teamRated.length : 0
  const clientRated = campaigns.filter((c) => c.client_rating != null)
  const avgClient = clientRated.length > 0 ? clientRated.reduce((s, c) => s + (c.client_rating ?? 0), 0) / clientRated.length : 0

  const byCategory: Record<string, { count: number; totalEng: number }> = {}
  for (const c of campaigns) {
    if (!c.brand_category || c.engagement_rate == null) continue
    const cat = c.brand_category
    byCategory[cat] = byCategory[cat] ?? { count: 0, totalEng: 0 }
    byCategory[cat].count++; byCategory[cat].totalEng += c.engagement_rate
  }
  const bestCat = Object.entries(byCategory).reduce(
    (b: [string, number], [cat, { count, totalEng }]) => {
      const avg = totalEng / count
      return avg > b[1] ? ([cat, avg] as [string, number]) : b
    },
    ['—', 0] as [string, number]
  )

  const byMonth: Record<string, number> = {}
  for (const c of campaigns) {
    const m = c.went_live_at?.slice(0, 7)
    if (m) byMonth[m] = (byMonth[m] ?? 0) + 1
  }
  const monthEntries = Object.entries(byMonth).sort().slice(-12)
  const maxMonth = Math.max(...monthEntries.map(([, v]) => v), 1)

  const catEntries = Object.entries(byCategory).map(([cat, { count, totalEng }]) => ({ cat, avg: totalEng / count })).sort((a, b) => b.avg - a.avg).slice(0, 6)
  const maxCatEng = Math.max(...catEntries.map((e) => e.avg), 1)

  const stats = [
    { label: 'Total campaigns', value: String(total) },
    { label: 'Avg engagement', value: `${avgEng.toFixed(1)}%` },
    { label: 'Best category', value: bestCat[0] },
    { label: 'Avg team rating', value: avgTeam > 0 ? avgTeam.toFixed(1) : '—' },
    { label: 'Avg client rating', value: avgClient > 0 ? avgClient.toFixed(1) : '—' },
    { label: 'Total views', value: totalViews.toLocaleString() },
    { label: 'Total leads', value: totalLeads.toLocaleString() },
  ]

  if (total === 0) return (
    <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center text-sm text-zinc-500">No campaigns logged yet.</div>
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-zinc-200 bg-white p-4">
            <div className="text-xl font-semibold tabular-nums text-zinc-900">{s.value}</div>
            <div className="mt-0.5 text-[11px] text-zinc-500">{s.label}</div>
          </div>
        ))}
      </div>
      {monthEntries.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-zinc-700">Campaigns over time</h3>
          <div className="space-y-2">
            {monthEntries.map(([m, count]) => (
              <div key={m} className="flex items-center gap-3">
                <span className="w-16 shrink-0 text-right text-xs text-zinc-500">{m}</span>
                <div className="flex-1 h-2 overflow-hidden rounded-full bg-zinc-100">
                  <div className="h-2 rounded-full bg-violet-500" style={{ width: `${(count / maxMonth) * 100}%` }} />
                </div>
                <span className="w-5 shrink-0 text-right text-xs tabular-nums text-zinc-700">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {catEntries.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-zinc-700">Category breakdown (avg engagement %)</h3>
          <div className="space-y-2">
            {catEntries.map(({ cat, avg }) => (
              <div key={cat} className="flex items-center gap-3">
                <span className="w-28 shrink-0 truncate text-xs capitalize text-zinc-600">{cat}</span>
                <div className="flex-1 h-2 overflow-hidden rounded-full bg-zinc-100">
                  <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${(avg / maxCatEng) * 100}%` }} />
                </div>
                <span className="w-12 shrink-0 text-right text-xs tabular-nums text-zinc-700">{avg.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function InfluencerProfileTabs({ influencer, campaigns, orgs, initialTab }: {
  influencer: Influencer
  campaigns: CampaignWithOrg[]
  orgs: OrgOption[]
  initialTab?: string
}) {
  const router = useRouter()
  const [editing, setEditing] = useState(initialTab === 'edit')
  const [activeTab, setActiveTab] = useState<'history' | 'performance'>('history')
  const [logOpen, setLogOpen] = useState(false)

  const tabs: Array<{ key: 'history' | 'performance'; label: string }> = [
    { key: 'history', label: 'Campaign History' },
    { key: 'performance', label: 'Performance Summary' },
  ]

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div>
        {editing
          ? <InfluencerForm initial={influencer} influencerId={influencer.id} onSaved={() => { setEditing(false); router.refresh() }} />
          : <ProfileCard inf={influencer} onEdit={() => setEditing(true)} />}
      </div>

      <div className="space-y-4 lg:col-span-2">
        <div className="flex border-b border-zinc-200">
          {tabs.map(({ key, label }) => (
            <button key={key} onClick={() => setActiveTab(key)} className={cn('px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors', activeTab === key ? 'border-[#7C3AED] text-[#7C3AED]' : 'border-transparent text-zinc-500 hover:text-zinc-900')}>
              {label}
            </button>
          ))}
        </div>
        {activeTab === 'history' && <CampaignHistoryTab campaigns={campaigns} onLog={() => setLogOpen(true)} />}
        {activeTab === 'performance' && <PerformanceSummaryTab campaigns={campaigns} />}
      </div>

      <LogCampaignSlideOver
        open={logOpen}
        onClose={() => setLogOpen(false)}
        influencerId={influencer.id}
        orgs={orgs}
        onLogged={() => router.refresh()}
      />
    </div>
  )
}
