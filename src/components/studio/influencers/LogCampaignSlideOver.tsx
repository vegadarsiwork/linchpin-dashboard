'use client'

import { useState } from 'react'
import type { ReactNode, FormEvent } from 'react'
import { toast } from 'sonner'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody, SheetFooter } from '@/components/ui/sheet'

interface OrgOption { id: string; name: string }

interface Props {
  open: boolean
  onClose: () => void
  influencerId: string
  orgs: OrgOption[]
  onLogged: () => void
}

const CONTENT_STYLES = ['Talking head', 'Cinematic', 'POV', 'Educational', 'Entertaining', 'Aesthetic', 'Raw & Real', 'Tutorial']

function MiniStars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" onClick={() => onChange(i)} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)}>
          <Star className={cn('h-5 w-5 transition-colors', i <= (hover || value) ? 'fill-amber-400 text-amber-400' : 'fill-none text-zinc-300')} />
        </button>
      ))}
    </div>
  )
}

function inputCls(extra = '') {
  return cn('h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100', extra)
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-zinc-700">{label}</label>
      {children}
    </div>
  )
}

export function LogCampaignSlideOver({ open, onClose, influencerId, orgs, onLogged }: Props) {
  const [orgId, setOrgId] = useState('')
  const [brandCategory, setBrandCategory] = useState('')
  const [goal, setGoal] = useState('')
  const [contentStyle, setContentStyle] = useState('')
  const [platform, setPlatform] = useState('')
  const [wentLiveAt, setWentLiveAt] = useState('')
  const [views, setViews] = useState('')
  const [likes, setLikes] = useState('')
  const [comments, setComments] = useState('')
  const [shares, setShares] = useState('')
  const [saves, setSaves] = useState('')
  const [reach, setReach] = useState('')
  const [leads, setLeads] = useState('')
  const [engRate, setEngRate] = useState('')
  const [teamRating, setTeamRating] = useState(0)
  const [clientRating, setClientRating] = useState(0)
  const [notes, setNotes] = useState('')
  const [scriptLink, setScriptLink] = useState('')
  const [saving, setSaving] = useState(false)

  function reset() {
    setOrgId(''); setBrandCategory(''); setGoal(''); setContentStyle(''); setPlatform('')
    setWentLiveAt(''); setViews(''); setLikes(''); setComments(''); setShares('')
    setSaves(''); setReach(''); setLeads(''); setEngRate(''); setTeamRating(0)
    setClientRating(0); setNotes(''); setScriptLink('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/admin/influencer-campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          influencer_id: influencerId,
          org_id: orgId || null,
          brand_category: brandCategory || null,
          campaign_goal: goal || null,
          content_style_used: contentStyle || null,
          platform: platform || null,
          went_live_at: wentLiveAt || null,
          views: views ? parseInt(views) : 0,
          likes: likes ? parseInt(likes) : 0,
          comments: comments ? parseInt(comments) : 0,
          shares: shares ? parseInt(shares) : 0,
          saves: saves ? parseInt(saves) : 0,
          reach: reach ? parseInt(reach) : 0,
          leads_generated: leads ? parseInt(leads) : 0,
          engagement_rate: engRate ? parseFloat(engRate) : null,
          team_rating: teamRating || null,
          client_rating: clientRating || null,
          notes: notes || null,
          script_id: scriptLink || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? 'Failed to log campaign'); return }
      toast.success('Campaign performance logged')
      reset(); onLogged(); onClose()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Log Campaign Performance</SheetTitle>
        </SheetHeader>
        <SheetBody>
          <form id="log-campaign-form" onSubmit={handleSubmit} className="space-y-4">
            <Row label="Client org">
              <select value={orgId} onChange={(e) => setOrgId(e.target.value)} className={inputCls()}>
                <option value="">Select client…</option>
                {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </Row>
            <div className="grid grid-cols-2 gap-3">
              <Row label="Brand category"><input value={brandCategory} onChange={(e) => setBrandCategory(e.target.value)} placeholder="FMCG, Skincare…" className={inputCls()} /></Row>
              <Row label="Campaign goal"><input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Awareness, Leads…" className={inputCls()} /></Row>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Row label="Content style">
                <select value={contentStyle} onChange={(e) => setContentStyle(e.target.value)} className={inputCls()}>
                  <option value="">Select…</option>
                  {CONTENT_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Row>
              <Row label="Platform">
                <select value={platform} onChange={(e) => setPlatform(e.target.value)} className={inputCls()}>
                  <option value="">Select…</option>
                  <option value="Instagram">Instagram</option>
                  <option value="YouTube">YouTube</option>
                  <option value="LinkedIn">LinkedIn</option>
                </select>
              </Row>
            </div>
            <Row label="Went live">
              <input type="date" value={wentLiveAt} onChange={(e) => setWentLiveAt(e.target.value)} className={inputCls()} />
            </Row>

            <div className="rounded-lg border border-zinc-200 p-3">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Performance metrics</p>
              <div className="grid grid-cols-2 gap-3">
                {([['Views', views, setViews], ['Likes', likes, setLikes], ['Comments', comments, setComments], ['Shares', shares, setShares], ['Saves', saves, setSaves], ['Reach', reach, setReach]] as [string, string, (v: string) => void][]).map(([label, val, setter]) => (
                  <Row key={label} label={label}>
                    <input type="number" min="0" value={val} onChange={(e) => setter(e.target.value)} placeholder="0" className={inputCls()} />
                  </Row>
                ))}
                <Row label="Leads generated">
                  <input type="number" min="0" value={leads} onChange={(e) => setLeads(e.target.value)} placeholder="0" className={inputCls()} />
                </Row>
                <Row label="Engagement rate %">
                  <input type="number" step="0.1" value={engRate} onChange={(e) => setEngRate(e.target.value)} placeholder="3.2" className={inputCls()} />
                </Row>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Row label="Team rating"><MiniStars value={teamRating} onChange={setTeamRating} /></Row>
              <Row label="Client rating"><MiniStars value={clientRating} onChange={setClientRating} /></Row>
            </div>

            <Row label="Notes">
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What worked, what didn't…" rows={3} className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm placeholder:text-zinc-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100" />
            </Row>
            <Row label="Script link (optional)">
              <input value={scriptLink} onChange={(e) => setScriptLink(e.target.value)} placeholder="Notion / Google Docs URL" className={inputCls()} />
            </Row>
          </form>
        </SheetBody>
        <SheetFooter>
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-zinc-200 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50">Cancel</button>
          <button type="submit" form="log-campaign-form" disabled={saving} className="h-10 rounded-lg bg-[#7C3AED] px-5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#6D28D9] disabled:opacity-60">
            {saving ? 'Logging…' : 'Log Performance'}
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
