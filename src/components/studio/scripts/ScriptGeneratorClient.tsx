'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { FileText, Loader2, Paperclip, X } from 'lucide-react'

type OrgOption = {
  id: string
  name: string
  brand_category: string | null
  target_audience: string | null
  brand_tone: string | null
}

type InfluencerOption = {
  id: string
  name: string
  handle: string | null
  platform: string | null
}

type Variation = {
  name: string
  hook: string
  beats: string[]
  shot_list: string[]
  caption_angle: string
  cta: string
  creator_notes: string
}

type BriefMode = 'text' | 'file'

export function ScriptGeneratorClient({
  orgs,
  influencers,
  initialOrgId,
  initialInfluencerId,
  initialMatchRequestId,
}: {
  orgs: OrgOption[]
  influencers: InfluencerOption[]
  initialOrgId: string
  initialInfluencerId: string
  initialMatchRequestId: string
}) {
  const [orgId, setOrgId] = useState(initialOrgId)
  const [influencerId, setInfluencerId] = useState(initialInfluencerId)
  const [matchRequestId] = useState(initialMatchRequestId)
  const [title, setTitle] = useState('')
  const [brief, setBrief] = useState('')
  const [briefMode, setBriefMode] = useState<BriefMode>('text')
  const [attachedFile, setAttachedFile] = useState<File | null>(null)
  const [parsingFile, setParsingFile] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [manualBody, setManualBody] = useState('')
  const [variations, setVariations] = useState<Variation[]>([])
  const [scriptId, setScriptId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!e.target.files) e.target.value = ''
    if (!file) return

    const name = file.name.toLowerCase()
    if (!name.endsWith('.txt') && !name.endsWith('.md') && !name.endsWith('.docx')) {
      toast.error('Only .txt, .md, and .docx files are accepted.')
      e.target.value = ''
      return
    }

    setAttachedFile(file)
    setParsingFile(true)

    try {
      // txt/md: read directly in browser; docx: send to server
      if (name.endsWith('.docx')) {
        const form = new FormData()
        form.append('file', file)
        const res = await fetch('/api/admin/scripts/parse-file', {
          method: 'POST',
          body: form,
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? 'Parse failed')
        setBrief(json.text ?? '')
      } else {
        const text = await file.text()
        setBrief(text)
      }
      setBriefMode('text')
      toast.success(`${file.name} loaded into brief.`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not read file.')
      setAttachedFile(null)
    } finally {
      setParsingFile(false)
      e.target.value = ''
    }
  }

  function clearFile() {
    setAttachedFile(null)
    setBrief('')
  }

  async function saveManual() {
    if (!orgId) { toast.error('Select a client'); return }
    if (!title.trim()) { toast.error('Add a title'); return }
    if (!manualBody.trim()) { toast.error('Paste your script first'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: orgId, title: title.trim(), body: manualBody.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Save failed')
      setScriptId(json.data?.id ?? null)
      toast.success('Script saved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save script')
    } finally {
      setSaving(false)
    }
  }

  async function generate() {
    if (!orgId) {
      toast.error('Select a client')
      return
    }
    setLoading(true)
    const res = await fetch('/api/admin/scripts/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        org_id: orgId,
        influencer_id: influencerId || null,
        match_request_id: matchRequestId || null,
        title,
        brief: brief ? { notes: brief } : undefined,
      }),
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) {
      toast.error(json.error ?? 'Failed to generate script')
      return
    }
    setScriptId(json.script_id ?? null)
    setVariations(json.script?.variations ?? [])
    toast.success('Script generated')
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      {/* ── Left panel ── */}
      <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5">
        <label className="space-y-1">
          <span className="text-xs font-medium text-zinc-500">Client</span>
          <select
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
            className="h-10 w-full rounded-lg border border-zinc-200 px-3 text-sm"
          >
            <option value="">Select client</option>
            {orgs.map((org) => (
              <option key={org.id} value={org.id}>{org.name}</option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-xs font-medium text-zinc-500">Creator</span>
          <select
            value={influencerId}
            onChange={(e) => setInfluencerId(e.target.value)}
            className="h-10 w-full rounded-lg border border-zinc-200 px-3 text-sm"
          >
            <option value="">Optional</option>
            {influencers.map((inf) => (
              <option key={inf.id} value={inf.id}>
                {inf.name}{inf.handle ? ` @${inf.handle}` : ''}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-xs font-medium text-zinc-500">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-10 w-full rounded-lg border border-zinc-200 px-3 text-sm"
            placeholder="Campaign title"
          />
        </label>

        {/* ── Brief section ── */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Brief</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setBriefMode('text')}
                className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
                  briefMode === 'text'
                    ? 'bg-violet-100 text-violet-700'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Type
              </button>
              <button
                type="button"
                onClick={() => {
                  setBriefMode('file')
                  fileInputRef.current?.click()
                }}
                className={`flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
                  briefMode === 'file'
                    ? 'bg-violet-100 text-violet-700'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                <Paperclip className="h-3 w-3" />
                Upload
              </button>
            </div>
          </div>

          {/* Attached file badge */}
          {attachedFile && (
            <div className="flex items-center gap-1.5 rounded-md bg-violet-50 px-2 py-1.5 text-xs text-violet-700">
              <FileText className="h-3.5 w-3.5 shrink-0" />
              <span className="min-w-0 truncate">{attachedFile.name}</span>
              <button
                type="button"
                onClick={clearFile}
                className="ml-auto shrink-0 rounded p-0.5 hover:bg-violet-200"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {parsingFile ? (
            <div className="flex h-10 items-center gap-2 text-xs text-zinc-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Extracting text…
            </div>
          ) : (
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={5}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              placeholder="Angle, offer, references, claims to avoid… or upload a file above."
            />
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.docx"
            onChange={handleFileChange}
            className="sr-only"
            tabIndex={-1}
          />
          <p className="text-[10px] text-zinc-400">Accepts .txt, .md, .docx (max 5 MB)</p>
        </div>

        <button
          onClick={generate}
          disabled={loading}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#7C3AED] text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Generate script
        </button>

        {scriptId && (
          <p className="text-xs text-zinc-500">Saved: {scriptId}</p>
        )}

        {/* ── Manual paste fallback ── */}
        <div className="border-t border-zinc-100 pt-4 space-y-2">
          <p className="text-xs font-medium text-zinc-500">
            Or paste a script directly
          </p>
          <textarea
            value={manualBody}
            onChange={(e) => setManualBody(e.target.value)}
            rows={6}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm placeholder:text-zinc-400"
            placeholder="Paste from ChatGPT, Claude, or write your own…"
          />
          <button
            onClick={saveManual}
            disabled={saving || !manualBody.trim()}
            className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save script
          </button>
        </div>
      </div>

      {/* ── Results ── */}
      <div className="space-y-4">
        {variations.length === 0 && (
          <div className="rounded-xl border border-dashed border-zinc-200 bg-white p-12 text-center text-sm text-zinc-500">
            Generated script variations will appear here.
          </div>
        )}
        {variations.map((variation, index) => (
          <article
            key={`${variation.name}-${index}`}
            className="rounded-xl border border-zinc-200 bg-white p-5"
          >
            <h2 className="text-base font-semibold text-zinc-900">
              {variation.name || `Variation ${index + 1}`}
            </h2>
            <p className="mt-2 rounded-lg bg-violet-50 p-3 text-sm font-medium text-violet-800">
              {variation.hook}
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Block title="Beats" items={variation.beats} />
              <Block title="Shot list" items={variation.shot_list} />
            </div>
            <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
              <Info title="Caption" text={variation.caption_angle} />
              <Info title="CTA" text={variation.cta} />
              <Info title="Creator notes" text={variation.creator_notes} />
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

function Block({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{title}</h3>
      <ul className="mt-2 space-y-2 text-sm text-zinc-700">
        {(items ?? []).map((item) => (
          <li key={item} className="rounded-lg bg-zinc-50 px-3 py-2">{item}</li>
        ))}
      </ul>
    </div>
  )
}

function Info({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg bg-zinc-50 p-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{title}</h3>
      <p className="mt-1 text-zinc-700">{text}</p>
    </div>
  )
}
