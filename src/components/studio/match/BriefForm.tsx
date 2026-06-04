'use client'

import { useState, useRef, useEffect } from 'react'
import type { FormEvent } from 'react'
import { ChevronDown, Search } from 'lucide-react'

export interface OrgOption {
  id: string
  name: string
  brand_category: string | null
  target_audience: string | null
  brand_tone: string | null
}

export interface BriefState {
  org_id: string
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

const GOALS = ['Awareness', 'Engagement', 'Conversions', 'Retention', 'Launch']
const FORMATS = ['Reel', 'Story', 'Post', 'YouTube', 'Live', 'Shorts']
const LANGUAGES = ['Hindi', 'English', 'Telugu', 'Tamil', 'Kannada', 'Bengali', 'Marathi']
const TONES = ['Fun', 'Professional', 'Inspirational', 'Educational', 'Luxury', 'Casual']
const BRAND_CATEGORIES = [
  'Fashion', 'Beauty', 'Food', 'Tech', 'Finance', 'Health', 'Fitness',
  'Gaming', 'Travel', 'Lifestyle', 'Auto', 'Jewellery', 'Education', 'Home Decor', 'FMCG',
]

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-zinc-700">{label}</label>
      {children}
    </div>
  )
}

function SegControl({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt === value ? '' : opt)}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            value === opt
              ? 'border-violet-600 bg-violet-600 text-white'
              : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

function OrgSearch({ orgs, value, onChange }: { orgs: OrgOption[]; value: string; onChange: (org: OrgOption) => void }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const selected = orgs.find((o) => o.id === value)
  const filtered = orgs.filter((o) => o.name.toLowerCase().includes(query.toLowerCase()))

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setOpen(!open); setQuery('') }}
        className="flex w-full items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-left hover:border-zinc-300"
      >
        <span className={selected ? 'text-zinc-900' : 'text-zinc-400'}>
          {selected ? selected.name : 'Select client…'}
        </span>
        <ChevronDown className="h-4 w-4 text-zinc-400 flex-shrink-0" />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-zinc-200 bg-white shadow-lg">
          <div className="flex items-center gap-2 border-b border-zinc-100 px-3 py-2">
            <Search className="h-3.5 w-3.5 flex-shrink-0 text-zinc-400" />
            <input
              autoFocus
              className="flex-1 text-sm outline-none"
              placeholder="Search clients…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-zinc-400">No clients found</p>
            ) : (
              filtered.map((org) => (
                <button
                  key={org.id}
                  type="button"
                  className="flex w-full items-start gap-2 px-3 py-2.5 text-left hover:bg-violet-50"
                  onClick={() => { onChange(org); setOpen(false) }}
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{org.name}</p>
                    {org.brand_category && (
                      <p className="text-xs text-zinc-400">{org.brand_category}</p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const DEFAULT_BRIEF: BriefState = {
  org_id: '',
  brand_category: '',
  target_audience: '',
  goal: '',
  format: '',
  language: '',
  tone: '',
  budget_min: null,
  budget_max: null,
  timeline: '',
  notes: '',
}

interface BriefFormProps {
  orgs: OrgOption[]
  onSubmit: (brief: BriefState) => void
  loading: boolean
}

export function BriefForm({ orgs, onSubmit, loading }: BriefFormProps) {
  const [brief, setBrief] = useState<BriefState>(DEFAULT_BRIEF)

  function set<K extends keyof BriefState>(key: K, val: BriefState[K]) {
    setBrief((b) => ({ ...b, [key]: val }))
  }

  function handleOrgSelect(org: OrgOption) {
    setBrief((b) => ({
      ...b,
      org_id: org.id,
      brand_category: org.brand_category ?? b.brand_category,
      target_audience: org.target_audience ?? b.target_audience,
      tone: org.brand_tone ?? b.tone,
    }))
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    onSubmit(brief)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Client *">
        <OrgSearch orgs={orgs} value={brief.org_id} onChange={handleOrgSelect} />
      </Field>

      <Field label="Brand Category">
        <SegControl
          options={BRAND_CATEGORIES}
          value={brief.brand_category}
          onChange={(v) => set('brand_category', v)}
        />
      </Field>

      <Field label="Target Audience">
        <input
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
          placeholder="e.g. Women 18–35, Tier 1 cities, fashion-conscious"
          value={brief.target_audience}
          onChange={(e) => set('target_audience', e.target.value)}
        />
      </Field>

      <Field label="Campaign Goal">
        <SegControl options={GOALS} value={brief.goal} onChange={(v) => set('goal', v)} />
      </Field>

      <Field label="Content Format">
        <SegControl options={FORMATS} value={brief.format} onChange={(v) => set('format', v)} />
      </Field>

      <Field label="Language">
        <SegControl options={LANGUAGES} value={brief.language} onChange={(v) => set('language', v)} />
      </Field>

      <Field label="Brand Tone">
        <SegControl options={TONES} value={brief.tone} onChange={(v) => set('tone', v)} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Budget Min (₹)">
          <input
            type="number"
            min={0}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
            placeholder="10000"
            value={brief.budget_min ?? ''}
            onChange={(e) => set('budget_min', e.target.value ? Number(e.target.value) : null)}
          />
        </Field>
        <Field label="Budget Max (₹)">
          <input
            type="number"
            min={0}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
            placeholder="50000"
            value={brief.budget_max ?? ''}
            onChange={(e) => set('budget_max', e.target.value ? Number(e.target.value) : null)}
          />
        </Field>
      </div>

      <Field label="Timeline">
        <input
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
          placeholder="e.g. 2 weeks, by Diwali, flexible"
          value={brief.timeline}
          onChange={(e) => set('timeline', e.target.value)}
        />
      </Field>

      <Field label="Additional Notes">
        <textarea
          rows={3}
          className="w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
          placeholder="Specific requirements, dos and don'ts, references…"
          value={brief.notes}
          onChange={(e) => set('notes', e.target.value)}
        />
      </Field>

      <button
        type="submit"
        disabled={!brief.org_id || loading}
        className="w-full rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Finding matches…' : 'Find Best Matches →'}
      </button>
    </form>
  )
}
