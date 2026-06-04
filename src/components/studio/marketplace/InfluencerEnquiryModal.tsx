'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, X } from 'lucide-react'
import type { PublicInfluencer } from '@/lib/types'

type EnquiryForm = {
  campaign_name: string
  campaign_start_date: string
  campaign_end_date: string
  deliverables: string
  budget_range: string
  requirements_notes: string
}

const EMPTY_FORM: EnquiryForm = {
  campaign_name: '',
  campaign_start_date: '',
  campaign_end_date: '',
  deliverables: '',
  budget_range: '',
  requirements_notes: '',
}

async function readJson(res: Response) {
  const text = await res.text()
  if (!text) return {}
  try {
    return JSON.parse(text) as Record<string, unknown>
  } catch {
    return { error: text.slice(0, 180) || `Request failed with ${res.status}` }
  }
}

function inputClass() {
  return 'app-input h-10 w-full rounded-md px-3 text-sm'
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="space-y-1">
      <span className="app-subtle block text-xs font-medium">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {children}
    </label>
  )
}

export function InfluencerEnquiryModal({
  influencer,
  matchRequestId,
  requestSource,
  onClose,
  onSuccess,
}: {
  influencer: PublicInfluencer
  matchRequestId?: string | null
  requestSource?: string
  onClose: () => void
  onSuccess?: () => void
}) {
  const [form, setForm] = useState<EnquiryForm>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  function setField<K extends keyof EnquiryForm>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.campaign_name.trim()) {
      toast.error('Campaign name is required')
      return
    }
    if (!form.deliverables.trim()) {
      toast.error('Deliverables are required')
      return
    }
    setSubmitting(true)
    const res = await fetch('/api/influencer-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        influencer_id: influencer.id,
        match_request_id: matchRequestId ?? undefined,
        request_source: requestSource ?? 'browse',
        campaign_name: form.campaign_name,
        campaign_start_date: form.campaign_start_date || undefined,
        campaign_end_date: form.campaign_end_date || undefined,
        deliverables: form.deliverables,
        budget_range: form.budget_range || undefined,
        requirements_notes: form.requirements_notes || undefined,
      }),
    })
    const json = await readJson(res)
    setSubmitting(false)
    if (!res.ok) {
      toast.error(String(json.error ?? 'Could not send enquiry'))
      return
    }
    toast.success('Enquiry sent! We will get back to you shortly.')
    onSuccess?.()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="app-panel w-full max-w-lg rounded-xl shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <div>
            <div className="app-heading text-base font-semibold">Enquire about {influencer.name}</div>
            <div className="app-subtle text-xs mt-0.5">{influencer.platform ?? 'Creator'}{influencer.city ? ` · ${influencer.city}` : ''}</div>
          </div>
          <button onClick={onClose} className="app-subtle hover:app-heading rounded-md p-1 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          <Field label="Campaign name" required>
            <input
              className={inputClass()}
              value={form.campaign_name}
              onChange={(e) => setField('campaign_name', e.target.value)}
              placeholder="e.g. Summer product launch"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Campaign start date">
              <input
                type="date"
                className={inputClass()}
                value={form.campaign_start_date}
                onChange={(e) => setField('campaign_start_date', e.target.value)}
              />
            </Field>
            <Field label="Campaign end date">
              <input
                type="date"
                className={inputClass()}
                value={form.campaign_end_date}
                onChange={(e) => setField('campaign_end_date', e.target.value)}
              />
            </Field>
          </div>
          <Field label="Deliverables needed" required>
            <textarea
              rows={3}
              className={`${inputClass()} h-auto py-2`}
              value={form.deliverables}
              onChange={(e) => setField('deliverables', e.target.value)}
              placeholder="e.g. 1 Instagram Reel, 2 Stories"
            />
          </Field>
          <Field label="Budget range (optional)">
            <input
              className={inputClass()}
              value={form.budget_range}
              onChange={(e) => setField('budget_range', e.target.value)}
              placeholder="e.g. Rs 15,000 – 25,000"
            />
          </Field>
          <Field label="Requirements / notes (optional)">
            <textarea
              rows={3}
              className={`${inputClass()} h-auto py-2`}
              value={form.requirements_notes}
              onChange={(e) => setField('requirements_notes', e.target.value)}
              placeholder="Any specific requirements, brand guidelines, timeline constraints..."
            />
          </Field>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-md ring-1 ring-zinc-200 app-nav-item text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 h-10 rounded-md bg-violet-600 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Send enquiry
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
