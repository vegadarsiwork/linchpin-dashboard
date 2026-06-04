'use client'

import { useState, useEffect } from 'react'
import { Loader2, CheckCircle2, AlertTriangle, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { ReelMedia } from '@/components/studio/reels/ReelMedia'
import type { ClipWithRelations, ClipApprovalElement, ClipElementType } from '@/lib/types'

const ELEMENTS: { type: ClipElementType; label: string; description: string }[] = [
  {
    type: 'background_location',
    label: 'Background / Location',
    description: 'Is the setting appropriate for the brand?',
  },
  {
    type: 'voice_audio',
    label: 'Voice / Audio',
    description: 'Is the audio clear and on-brand?',
  },
  {
    type: 'influencer_presence',
    label: 'Influencer Presence',
    description: 'Is the influencer\'s appearance and delivery on-point?',
  },
]

type LocalElement = {
  status: 'pending' | 'approved' | 'flagged'
  comment: string
  saving: boolean
}

function initLocal(elements: ClipApprovalElement[]): Record<ClipElementType, LocalElement> {
  const map = {} as Record<ClipElementType, LocalElement>
  for (const el of ELEMENTS) {
    const existing = elements.find((e) => e.element_type === el.type)
    map[el.type] = {
      status: existing?.status ?? 'pending',
      comment: existing?.comment ?? '',
      saving: false,
    }
  }
  return map
}

export type ClipReviewModalProps = {
  clip: ClipWithRelations | null
  onClose: () => void
  onUpdated: (id: string, updates: Partial<ClipWithRelations>) => void
}

export function ClipReviewModal({ clip, onClose, onUpdated }: ClipReviewModalProps) {
  const [local, setLocal] = useState<Record<ClipElementType, LocalElement>>(
    () => (clip ? initLocal(clip.elements) : ({} as Record<ClipElementType, LocalElement>))
  )
  const [finalAction, setFinalAction] = useState<'approve' | 'request_changes' | null>(null)
  const [feedbackText, setFeedbackText] = useState('')
  const [submittingFinal, setSubmittingFinal] = useState(false)

  useEffect(() => {
    if (clip) {
      setLocal(initLocal(clip.elements))
      setFinalAction(null)
      setFeedbackText('')
      setSubmittingFinal(false)
    }
  }, [clip])

  if (!clip) return null

  const clipId = clip.id
  const allReviewed = ELEMENTS.every((el) => local[el.type]?.status !== 'pending')
  const isLocked = clip.status === 'approved' || clip.status === 'changes_requested'

  async function reviewElement(type: ClipElementType, status: 'approved' | 'flagged') {
    if (isLocked) return
    setLocal((prev) => ({
      ...prev,
      [type]: { ...prev[type], status, saving: true },
    }))

    try {
      const res = await fetch(`/api/clips/${clipId}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          element_type: type,
          element_status: status,
          element_comment: local[type]?.comment || undefined,
        }),
      })
      if (!res.ok) throw new Error('save failed')
      onUpdated(clipId, {})
    } catch {
      toast.error('Could not save review. Try again.')
      setLocal((prev) => ({
        ...prev,
        [type]: { ...prev[type], status: 'pending', saving: false },
      }))
      return
    }

    setLocal((prev) => ({
      ...prev,
      [type]: { ...prev[type], saving: false },
    }))
  }

  async function saveComment(type: ClipElementType) {
    if (!local[type] || local[type].status === 'pending') return
    await reviewElement(type, local[type].status as 'approved' | 'flagged')
  }

  async function submitFinal() {
    if (!finalAction || !allReviewed || !clip) return
    setSubmittingFinal(true)
    try {
      const body =
        finalAction === 'approve'
          ? { action: 'approve' }
          : { action: 'request_changes', feedback: feedbackText.trim() || undefined }

      const res = await fetch(`/api/clips/${clip.id}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('failed')

      toast.success(
        finalAction === 'approve' ? 'Clip approved.' : 'Changes requested. Admin notified.'
      )
      const newStatus = finalAction === 'approve' ? 'approved' : 'changes_requested'
      onUpdated(clip.id, { status: newStatus })
      onClose()
    } catch {
      toast.error('Could not submit. Try again.')
    } finally {
      setSubmittingFinal(false)
    }
  }

  return (
    <Dialog open={!!clip} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-zinc-200">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="app-heading text-lg font-semibold">
                {clip.title}
              </DialogTitle>
              {clip.campaign_name && (
                <p className="app-subtle mt-0.5 text-sm">{clip.campaign_name}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-[1fr_380px]">
          {/* Video */}
          <div className="overflow-hidden rounded-lg bg-zinc-900">
            {clip.preview_url ? (
              <ReelMedia
                src={clip.preview_url}
                controls
                className="w-full max-h-[420px] object-contain"
                iframeClassName="w-full aspect-video border-0"
              />
            ) : (
              <div className="flex aspect-video w-full items-center justify-center text-sm text-zinc-500">
                No preview available
              </div>
            )}
          </div>

          {/* Approval matrix */}
          <div className="space-y-4">
            <p className="text-sm font-semibold app-heading">Approval Matrix</p>

            {ELEMENTS.map((el) => {
              const state = local[el.type]
              if (!state) return null
              const approved = state.status === 'approved'
              const flagged = state.status === 'flagged'

              return (
                <div
                  key={el.type}
                  className={cn(
                    'rounded-lg border p-4 space-y-3',
                    approved && 'border-emerald-200 bg-emerald-50/40',
                    flagged && 'border-amber-200 bg-amber-50/40',
                    !approved && !flagged && 'border-zinc-200 bg-zinc-50'
                  )}
                >
                  <div>
                    <p className="text-sm font-medium app-heading">{el.label}</p>
                    <p className="app-subtle text-[11px]">{el.description}</p>
                  </div>

                  {!isLocked && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => reviewElement(el.type, 'approved')}
                        disabled={state.saving}
                        className={cn(
                          'flex flex-1 items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
                          approved
                            ? 'border-emerald-300 bg-emerald-100 text-emerald-800'
                            : 'border-zinc-200 bg-white text-zinc-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700'
                        )}
                      >
                        {state.saving && state.status === 'approved' ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3 w-3" />
                        )}
                        Approve
                      </button>
                      <button
                        onClick={() => reviewElement(el.type, 'flagged')}
                        disabled={state.saving}
                        className={cn(
                          'flex flex-1 items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
                          flagged
                            ? 'border-amber-300 bg-amber-100 text-amber-800'
                            : 'border-zinc-200 bg-white text-zinc-700 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700'
                        )}
                      >
                        {state.saving && state.status === 'flagged' ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <AlertTriangle className="h-3 w-3" />
                        )}
                        Flag
                      </button>
                    </div>
                  )}

                  {(flagged || (isLocked && state.comment)) && (
                    <div className="space-y-1.5">
                      {!isLocked ? (
                        <>
                          <Textarea
                            value={state.comment}
                            onChange={(e) =>
                              setLocal((prev) => ({
                                ...prev,
                                [el.type]: { ...prev[el.type], comment: e.target.value },
                              }))
                            }
                            onBlur={() => saveComment(el.type)}
                            placeholder="Describe the issue…"
                            rows={2}
                            className="text-xs"
                          />
                        </>
                      ) : (
                        state.comment && (
                          <p className="text-xs text-amber-700 italic">
                            &ldquo;{state.comment}&rdquo;
                          </p>
                        )
                      )}
                    </div>
                  )}

                  {isLocked && state.status !== 'pending' && (
                    <div className={cn(
                      'text-[11px] font-medium',
                      state.status === 'approved' ? 'text-emerald-600' : 'text-amber-600'
                    )}>
                      {state.status === 'approved' ? '✓ Approved' : '⚑ Flagged'}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Final actions */}
            {!isLocked && (
              <div className="space-y-3 pt-2 border-t border-zinc-200">
                {!allReviewed && (
                  <p className="text-[11px] app-subtle text-center">
                    Review all three elements to unlock final approval.
                  </p>
                )}

                {allReviewed && !finalAction && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 shadow-none"
                      onClick={() => setFinalAction('approve')}
                    >
                      Approve clip
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                      onClick={() => setFinalAction('request_changes')}
                    >
                      Request changes
                    </Button>
                  </div>
                )}

                {finalAction === 'approve' && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium app-heading">Confirm approval</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-zinc-200 text-zinc-700"
                        onClick={() => setFinalAction(null)}
                        disabled={submittingFinal}
                      >
                        Back
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 shadow-none"
                        onClick={submitFinal}
                        disabled={submittingFinal}
                      >
                        {submittingFinal ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          'Confirm approve'
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {finalAction === 'request_changes' && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium app-heading">Describe the changes needed</p>
                    <Textarea
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="What should the Studio team change?"
                      rows={3}
                      className="text-sm"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-zinc-200 text-zinc-700"
                        onClick={() => setFinalAction(null)}
                        disabled={submittingFinal}
                      >
                        Back
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 shadow-none"
                        onClick={submitFinal}
                        disabled={!feedbackText.trim() || submittingFinal}
                      >
                        {submittingFinal ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          'Send feedback'
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {isLocked && (
              <div className={cn(
                'rounded-lg border px-4 py-3 text-sm font-medium text-center',
                clip.status === 'approved'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-red-200 bg-red-50 text-red-800'
              )}>
                {clip.status === 'approved' ? 'Clip approved' : 'Changes requested'}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
