'use client'

import { useEffect, useState } from 'react'
import { Check, Download, Loader2, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { StatusBadge } from '@/components/studio/StatusBadge'
import { formatDate } from '@/lib/utils/dates'
import { ReelMedia } from './ReelMedia'
import { ReelVersionHistory } from './ReelVersionHistory'
import { ReelAdminVersionUpload } from './ReelAdminVersionUpload'
import type {
  ContentItem,
  ContentItemVersion,
  ReelCorrection,
} from '@/lib/types'

const CAN_ACTION = new Set([
  'pending_approval',
  'correction_submitted',
])

export type ReelDetailModalProps = {
  item: ContentItem | null
  onClose: () => void
  onResolved?: (id: string, nextStatus: string) => void
  isAdmin?: boolean
}

export function ReelDetailModal({
  item,
  onClose,
  onResolved,
  isAdmin,
}: ReelDetailModalProps) {
  const [approving, setApproving] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [correctionNote, setCorrectionNote] = useState('')
  const [submittingCorrection, setSubmittingCorrection] = useState(false)
  const [versions, setVersions] = useState<ContentItemVersion[]>([])
  const [corrections, setCorrections] = useState<ReelCorrection[]>([])
  const [loadingDetail, setLoadingDetail] = useState(false)

  const itemId = item?.id
  useEffect(() => {
    if (!itemId) {
      setVersions([])
      setCorrections([])
      setCorrectionNote('')
      return
    }
    setLoadingDetail(true)
    fetch(`/api/reels/${itemId}`)
      .then((r) => r.json())
      .then(({ data }) => {
        if (data) {
          setVersions(data.versions ?? [])
          setCorrections(data.corrections ?? [])
        }
      })
      .catch(() => {})
      .finally(() => setLoadingDetail(false))
  }, [itemId])

  async function approveFinal() {
    if (!item) return
    setApproving(true)
    try {
      const res = await fetch(`/api/reels/${item.id}/approve-final`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('approve failed')
      toast.success('Final approved')
      onResolved?.(item.id, 'final_approved')
      onClose()
    } catch {
      toast.error('Could not approve. Try again.')
    } finally {
      setApproving(false)
    }
  }

  async function submitCorrection() {
    if (!item || !correctionNote.trim()) return
    setSubmittingCorrection(true)
    try {
      const res = await fetch(`/api/reels/${item.id}/corrections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: correctionNote }),
      })
      if (!res.ok) throw new Error('failed')
      toast.success('Corrections submitted')
      setCorrectionNote('')
      onResolved?.(item.id, 'correction_requested')
      onClose()
    } catch {
      toast.error('Could not submit corrections. Try again.')
    } finally {
      setSubmittingCorrection(false)
    }
  }

  async function downloadVersion(version: ContentItemVersion | null) {
    if (!item) return
    const url = version
      ? (version.full_quality_url ?? version.asset_url)
      : item.full_quality_url
    if (!url) return
    setDownloading(true)
    try {
      window.open(url, '_blank', 'noopener,noreferrer')
      fetch(`/api/reels/${item.id}/download-log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version_id: version?.id ?? null }),
      }).catch(() => {})
    } finally {
      setDownloading(false)
    }
  }

  const canAction = item ? CAN_ACTION.has(item.status) : false
  const awaitingAdminRevision =
    isAdmin && item?.status === 'correction_requested'

  return (
    <Dialog
      open={!!item}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="max-w-5xl gap-0 p-0 overflow-hidden">
        {item && (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] max-h-[85vh]">
            {/* Left — video */}
            <div className="relative flex items-center justify-center bg-black">
              {item.asset_url ? (
                <ReelMedia
                  src={item.asset_url}
                  controls
                  autoPlay
                  className="h-full max-h-[85vh] w-full object-contain aspect-[9/16]"
                  iframeClassName="h-full min-h-[70vh] max-h-[85vh] w-full border-0"
                />
              ) : (
                <div className="aspect-[9/16] w-full flex items-center justify-center text-sm text-zinc-400">
                  No preview
                </div>
              )}
            </div>

            {/* Right — metadata + actions */}
            <div className="flex flex-col overflow-y-auto p-5">
              {/* Status row */}
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {item.platform && (
                  <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium capitalize text-zinc-700">
                    {item.platform}
                  </span>
                )}
                <StatusBadge status={item.status} variant="content" />
                {item.status === 'correction_submitted' && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                    New version available
                  </span>
                )}
              </div>

              <DialogTitle asChild>
                <h2 className="app-heading mb-2 text-lg font-semibold tracking-tight">
                  {item.title}
                </h2>
              </DialogTitle>

              {item.caption && (
                <p className="mb-3 max-h-28 overflow-y-auto text-sm text-zinc-600 whitespace-pre-wrap">
                  {item.caption}
                </p>
              )}

              {item.hashtags?.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1">
                  {item.hashtags.map((h) => (
                    <span
                      key={h}
                      className="rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-700"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              )}

              <dl className="mb-3 space-y-1.5 border-t border-zinc-100 pt-3 text-sm">
                {item.scheduled_for && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-zinc-500">Scheduled</dt>
                    <dd className="tabular-nums text-zinc-900">
                      {formatDate(item.scheduled_for)}
                    </dd>
                  </div>
                )}
                {item.published_at && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-zinc-500">Published</dt>
                    <dd className="tabular-nums text-zinc-900">
                      {formatDate(item.published_at)}
                    </dd>
                  </div>
                )}
              </dl>

              {/* Correction history */}
              {corrections.length > 0 && (
                <div className="mb-3">
                  <p className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                    <MessageSquare className="h-3 w-3" />
                    Correction notes
                  </p>
                  <ul className="max-h-36 space-y-1.5 overflow-y-auto">
                    {corrections.map((c) => (
                      <li
                        key={c.id}
                        className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs"
                      >
                        <p className="whitespace-pre-wrap text-amber-900">{c.note}</p>
                        <p className="mt-1 text-amber-600">{formatDate(c.created_at)}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Legacy client_feedback (backwards compat) */}
              {item.status === 'rejected' &&
                item.client_feedback &&
                corrections.length === 0 && (
                  <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    <p className="mb-1 text-xs font-semibold">Your feedback</p>
                    <p className="whitespace-pre-wrap">{item.client_feedback}</p>
                  </div>
                )}

              {/* Client: correction textarea */}
              {canAction && !isAdmin && (
                <div className="mb-3">
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                    Request corrections
                  </label>
                  <Textarea
                    value={correctionNote}
                    onChange={(e) => setCorrectionNote(e.target.value)}
                    placeholder="Describe what needs to change…"
                    rows={3}
                    className="app-input resize-none text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={submitCorrection}
                    disabled={!correctionNote.trim() || submittingCorrection}
                    className="mt-2 w-full"
                  >
                    {submittingCorrection ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : null}
                    Submit corrections
                  </Button>
                </div>
              )}

              {/* Admin: upload new version when correction_requested */}
              {awaitingAdminRevision && (
                <div className="mb-3">
                  <ReelAdminVersionUpload
                    reelId={item.id}
                    onUploaded={(nextStatus) => {
                      onResolved?.(item.id, nextStatus)
                      onClose()
                    }}
                  />
                </div>
              )}

              {/* Download latest */}
              {item.full_quality_url && (
                <Button
                  variant="outline"
                  onClick={() => downloadVersion(null)}
                  disabled={downloading}
                  className="mb-2 w-full"
                >
                  {downloading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Download full quality
                </Button>
              )}

              {/* Approve Final */}
              {canAction && !isAdmin && (
                <Button
                  onClick={approveFinal}
                  disabled={approving}
                  className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  {approving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Approve Final
                </Button>
              )}

              {/* Version history */}
              {!loadingDetail && (
                <ReelVersionHistory
                  versions={versions}
                  onDownloadVersion={downloadVersion}
                />
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
