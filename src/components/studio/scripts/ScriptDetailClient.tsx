'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, CheckCircle, AlertCircle, Clock, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Script, ScriptVersion, ScriptComment } from '@/lib/types'
import { toast } from 'sonner'

type ScriptWithCampaign = Script & { campaigns: { id: string; name: string } | null }
type ActivityRow = { id: string; type: string; title: string; description: string | null; created_at: string }

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

function ScriptBody({
  body,
  comments,
  onAddComment,
}: {
  body: string
  comments: ScriptComment[]
  onAddComment: (idx: number, text: string) => void
}) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null)
  const [commentText, setCommentText] = useState('')
  const [saving, setSaving] = useState(false)

  const paragraphs = body.split(/\n\n+/).filter(Boolean)

  async function handleSubmitComment(idx: number) {
    if (!commentText.trim()) return
    setSaving(true)
    try {
      await onAddComment(idx, commentText)
      setCommentText('')
      setActiveIdx(null)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      {paragraphs.map((para, idx) => {
        const paraComments = comments.filter((c) => c.paragraph_index === idx)
        return (
          <div key={idx} className="group relative">
            <div
              className="cursor-pointer rounded-lg p-3 transition-colors hover:bg-violet-50"
              onClick={() => setActiveIdx(activeIdx === idx ? null : idx)}
            >
              <p className="text-sm leading-relaxed text-zinc-700 whitespace-pre-wrap">{para}</p>
              {paraComments.length > 0 && (
                <div className="mt-2 flex items-center gap-1 text-xs text-violet-600">
                  <MessageSquare className="h-3 w-3" />
                  {paraComments.length} comment{paraComments.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>

            {activeIdx === idx && (
              <div className="ml-3 mt-1 space-y-2 rounded-lg border border-violet-200 bg-violet-50 p-3">
                {paraComments.map((c) => (
                  <div key={c.id} className="rounded bg-white px-3 py-2 text-xs text-zinc-700 shadow-sm">
                    {c.comment}
                    <span className="ml-2 text-zinc-400">
                      {new Date(c.created_at).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                ))}
                <textarea
                  className="app-input w-full rounded-md p-2 text-xs"
                  rows={2}
                  placeholder="Add a comment on this paragraph…"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSubmitComment(idx)}
                    disabled={saving || !commentText.trim()}
                    className="rounded-md bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving…' : 'Add comment'}
                  </button>
                  <button
                    onClick={() => { setActiveIdx(null); setCommentText('') }}
                    className="rounded-md px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

interface Props {
  script: ScriptWithCampaign
  versions: ScriptVersion[]
  comments: ScriptComment[]
  timeline: ActivityRow[]
}

export function ScriptDetailClient({ script, versions, comments, timeline }: Props) {
  const [currentScript, setCurrentScript] = useState(script)
  const [currentComments, setCurrentComments] = useState(comments)
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const canAct = !['approved', 'draft'].includes(currentScript.status)

  async function handleStatusUpdate(status: 'approved' | 'changes_requested') {
    if (submitting) return
    if (status === 'changes_requested' && !feedback.trim()) {
      toast.error('Please describe what changes are needed.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/scripts/${currentScript.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, feedback: feedback.trim() || undefined }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      setCurrentScript((prev) => ({ ...prev, status }))
      setShowRequestForm(false)
      setFeedback('')
      toast.success(status === 'approved' ? 'Script approved!' : 'Changes requested.')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAddComment(paragraphIndex: number, comment: string) {
    const res = await fetch(`/api/scripts/${currentScript.id}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment, paragraph_index: paragraphIndex }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? 'Failed to save comment')
    setCurrentComments((prev) => [...prev, json.data])
    toast.success('Comment added.')
  }

  const displayBody = currentScript.body ?? ''

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/scripts"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800"
        >
          <ChevronLeft className="h-4 w-4" /> All scripts
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="app-heading text-xl font-semibold">{currentScript.title}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {currentScript.campaigns && (
                <span className="text-sm text-zinc-500">
                  {currentScript.campaigns.name}
                </span>
              )}
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold',
                  STATUS_CLASSES[currentScript.status] ?? 'bg-zinc-100 text-zinc-600'
                )}
              >
                {STATUS_LABELS[currentScript.status] ?? currentScript.status}
              </span>
            </div>
          </div>

          {canAct && (
            <div className="flex gap-2">
              <button
                onClick={() => handleStatusUpdate('approved')}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" />
                Approve
              </button>
              <button
                onClick={() => setShowRequestForm((v) => !v)}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 rounded-lg border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-100 disabled:opacity-50"
              >
                <AlertCircle className="h-4 w-4" />
                Request Changes
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Request changes form */}
      {showRequestForm && (
        <div className="app-muted-panel rounded-lg p-4 space-y-3">
          <p className="text-sm font-medium text-zinc-900">Describe the changes needed:</p>
          <textarea
            className="app-input w-full rounded-lg p-3 text-sm"
            rows={4}
            placeholder="What should be changed or improved…"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              onClick={() => handleStatusUpdate('changes_requested')}
              disabled={submitting || !feedback.trim()}
              className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Submit request'}
            </button>
            <button
              onClick={() => { setShowRequestForm(false); setFeedback('') }}
              className="rounded-lg px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Script body */}
        <div className="app-panel rounded-lg p-5">
          <h2 className="app-heading mb-4 text-sm font-semibold uppercase tracking-wide">
            Script
          </h2>
          {displayBody ? (
            <ScriptBody
              body={displayBody}
              comments={currentComments}
              onAddComment={handleAddComment}
            />
          ) : (
            <p className="app-subtle text-sm">No script content yet.</p>
          )}
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Version history */}
          {versions.length > 0 && (
            <div className="app-panel rounded-lg p-4">
              <h3 className="app-heading mb-3 text-xs font-semibold uppercase tracking-wide">
                Versions
              </h3>
              <ul className="space-y-2">
                {versions.map((v) => (
                  <li key={v.id} className="flex items-start justify-between text-xs">
                    <div>
                      <span className="font-medium text-zinc-900">v{v.version_number}</span>
                      {v.note && (
                        <p className="app-subtle mt-0.5">{v.note}</p>
                      )}
                    </div>
                    <span className="app-subtle shrink-0">
                      {new Date(v.created_at).toLocaleDateString('en-IN')}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Status timeline */}
          {timeline.length > 0 && (
            <div className="app-panel rounded-lg p-4">
              <h3 className="app-heading mb-3 text-xs font-semibold uppercase tracking-wide">
                Timeline
              </h3>
              <ul className="space-y-3">
                {timeline.map((a) => (
                  <li key={a.id} className="flex items-start gap-2">
                    <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
                    <div>
                      <p className="text-xs font-medium text-zinc-800">{a.title}</p>
                      {a.description && (
                        <p className="app-subtle mt-0.5 text-[11px]">{a.description}</p>
                      )}
                      <p className="app-subtle mt-0.5 text-[11px]">
                        {new Date(a.created_at).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
