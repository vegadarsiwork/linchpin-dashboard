'use client'

import { useState } from 'react'
import { Plus, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Script, ScriptComment } from '@/lib/types'
import { toast } from 'sonner'

type ScriptWithCampaign = Script & { campaigns: { id: string; name: string } | null }

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  pending_review: 'Pending Review',
  under_review: 'Under Review',
  changes_requested: 'Changes Requested',
  revised: 'Revised',
  approved: 'Approved',
}

const STATUS_CLASSES: Record<string, string> = {
  draft: 'bg-zinc-100 text-zinc-600',
  pending_review: 'bg-amber-100 text-amber-700',
  under_review: 'bg-blue-100 text-blue-700',
  changes_requested: 'bg-orange-100 text-orange-700',
  revised: 'bg-violet-100 text-violet-700',
  approved: 'bg-emerald-100 text-emerald-700',
}

const ADMIN_STATUSES = ['draft', 'pending_review', 'under_review', 'changes_requested', 'revised', 'approved']

interface CreateFormProps {
  orgId: string
  campaigns: { id: string; name: string }[]
  onCreated: (s: Script) => void
}

function CreateScriptForm({ orgId, campaigns, onCreated }: CreateFormProps) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [campaignId, setCampaignId] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !body.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: orgId,
          campaign_id: campaignId || null,
          title: title.trim(),
          body: body.trim(),
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      onCreated(json.data as Script)
      setTitle('')
      setBody('')
      setCampaignId('')
      toast.success('Script created and sent for client review.')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-700">Title *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="app-input w-full rounded-md px-3 py-2 text-sm"
            placeholder="Script title"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-700">Campaign</label>
          <select
            value={campaignId}
            onChange={(e) => setCampaignId(e.target.value)}
            className="app-input w-full rounded-md px-3 py-2 text-sm"
          >
            <option value="">No campaign</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-700">Script body *</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="app-input w-full rounded-md px-3 py-2 text-sm"
          rows={10}
          placeholder="Write the script here. Separate paragraphs with a blank line."
          required
        />
      </div>
      <button
        type="submit"
        disabled={saving || !title.trim() || !body.trim()}
        className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
      >
        {saving ? 'Creating…' : 'Create & send for review'}
      </button>
    </form>
  )
}

interface ReviseFormProps {
  scriptId: string
  onRevised: (scriptId: string, body: string) => void
}

function ReviseForm({ scriptId, onRevised }: ReviseFormProps) {
  const [body, setBody] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/scripts/${scriptId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: body.trim(), note: note.trim() || undefined }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      onRevised(scriptId, body.trim())
      setBody('')
      setNote('')
      toast.success('New version created.')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2 border-t border-zinc-200 pt-3">
      <p className="text-xs font-medium text-zinc-700">Create new version</p>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="app-input w-full rounded-md px-3 py-2 text-xs"
        rows={6}
        placeholder="Revised script content…"
        required
      />
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="app-input w-full rounded-md px-3 py-2 text-xs"
        placeholder="Revision note (optional)"
      />
      <button
        type="submit"
        disabled={saving || !body.trim()}
        className="rounded-md bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Publish revision'}
      </button>
    </form>
  )
}

interface Props {
  orgId: string
  scripts: ScriptWithCampaign[]
  campaigns: { id: string; name: string }[]
  allComments: ScriptComment[]
}

export function AdminScriptsClient({ orgId, scripts: initial, campaigns, allComments }: Props) {
  const [scripts, setScripts] = useState(initial)
  const [showCreate, setShowCreate] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  function handleCreated(s: Script) {
    setScripts((prev) => [s as ScriptWithCampaign, ...prev])
    setShowCreate(false)
  }

  function handleRevised(scriptId: string, newBody: string) {
    setScripts((prev) =>
      prev.map((s) => (s.id === scriptId ? { ...s, body: newBody, status: 'revised' } : s))
    )
  }

  async function handleStatusChange(scriptId: string, status: string) {
    setUpdatingStatus(scriptId)
    try {
      const res = await fetch(`/api/scripts/${scriptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      setScripts((prev) => prev.map((s) => (s.id === scriptId ? { ...s, status } : s)))
      toast.success('Status updated.')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setUpdatingStatus(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Create toggle */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
        >
          <Plus className="h-4 w-4" />
          {showCreate ? 'Cancel' : 'New script'}
        </button>
      </div>

      {showCreate && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <h3 className="mb-4 text-sm font-semibold text-zinc-900">Create script</h3>
          <CreateScriptForm orgId={orgId} campaigns={campaigns} onCreated={handleCreated} />
        </div>
      )}

      {/* Script list */}
      {scripts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center">
          <p className="text-sm text-zinc-500">No scripts yet. Create the first one.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {scripts.map((s) => {
            const scriptComments = allComments.filter((c) => c.script_id === s.id)
            const isExpanded = expanded === s.id
            return (
              <div key={s.id} className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
                <div
                  className="flex cursor-pointer items-center justify-between gap-3 p-4 hover:bg-zinc-50"
                  onClick={() => setExpanded(isExpanded ? null : s.id)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-zinc-900">{s.title}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                      {s.campaigns && <span>{s.campaigns.name}</span>}
                      <span>
                        {new Date(s.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </span>
                      {scriptComments.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-orange-600">
                          <MessageSquare className="h-3 w-3" />
                          {scriptComments.length} comment{scriptComments.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold',
                        STATUS_CLASSES[s.status] ?? 'bg-zinc-100 text-zinc-600'
                      )}
                    >
                      {STATUS_LABELS[s.status] ?? s.status}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-zinc-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-zinc-400" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-zinc-100 px-4 pb-4 pt-3 space-y-4">
                    {/* Status control */}
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium text-zinc-600">Status:</label>
                      <select
                        value={s.status}
                        onChange={(e) => handleStatusChange(s.id, e.target.value)}
                        disabled={updatingStatus === s.id}
                        className="app-input rounded-md px-2 py-1 text-xs"
                      >
                        {ADMIN_STATUSES.map((st) => (
                          <option key={st} value={st}>{STATUS_LABELS[st]}</option>
                        ))}
                      </select>
                    </div>

                    {/* Script body preview */}
                    {s.body && (
                      <div className="rounded-lg bg-zinc-50 p-3 text-xs leading-relaxed text-zinc-700 whitespace-pre-wrap max-h-48 overflow-y-auto">
                        {s.body}
                      </div>
                    )}

                    {/* Client comments */}
                    {scriptComments.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-zinc-700">Client comments</p>
                        {scriptComments.map((c) => (
                          <div key={c.id} className="rounded-lg border border-orange-100 bg-orange-50 px-3 py-2">
                            <p className="text-xs text-zinc-700">{c.comment}</p>
                            {c.paragraph_index !== null && (
                              <p className="mt-0.5 text-[11px] text-zinc-400">
                                Paragraph {c.paragraph_index + 1}
                              </p>
                            )}
                            <p className="mt-0.5 text-[11px] text-zinc-400">
                              {new Date(c.created_at).toLocaleString('en-IN', {
                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                              })}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Create revision */}
                    <ReviseForm scriptId={s.id} onRevised={handleRevised} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
