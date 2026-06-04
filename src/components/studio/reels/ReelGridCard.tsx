'use client'

import { useRef, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/studio/StatusBadge'
import { RequestChangesDialog } from '@/components/studio/dashboard/RequestChangesDialog'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils/dates'
import { ReelMedia } from './ReelMedia'
import type { ContentItem } from '@/lib/types'

export type ReelGridCardProps = {
  item: ContentItem
  onResolved?: (id: string, nextStatus: 'approved' | 'rejected') => void
  onOpen: (item: ContentItem) => void
}

export function ReelGridCard({ item, onResolved, onOpen }: ReelGridCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [approving, setApproving] = useState(false)
  const [approved, setApproved] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  function handleEnter() {
    const v = videoRef.current
    if (!v) return
    v.currentTime = 0
    void v.play().catch(() => {})
  }
  function handleLeave() {
    const v = videoRef.current
    if (!v) return
    v.pause()
    v.currentTime = 0
  }

  async function approve(e: React.MouseEvent) {
    e.stopPropagation()
    setApproving(true)
    setApproved(true)
    try {
      const res = await fetch(`/api/content/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      })
      if (!res.ok) throw new Error('approve failed')
      toast.success('Approved')
      setTimeout(() => onResolved?.(item.id, 'approved'), 600)
    } catch {
      setApproved(false)
      setApproving(false)
      toast.error('Could not approve. Try again.')
    }
  }

  async function requestChanges(feedback: string) {
    try {
      const res = await fetch(`/api/content/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected', client_feedback: feedback }),
      })
      if (!res.ok) throw new Error('failed')
      toast.success('Feedback sent')
      setDialogOpen(false)
      onResolved?.(item.id, 'rejected')
    } catch {
      toast.error('Could not send feedback. Try again.')
    }
  }

  const isPending = item.status === 'pending_approval'

  return (
    <>
      <div
        onClick={() => onOpen(item)}
        className={cn(
          'app-muted-panel group flex cursor-pointer flex-col overflow-hidden rounded-lg transition-colors hover:border-violet-200',
          approved && 'border-emerald-400/50 ring-1 ring-emerald-400/20'
        )}
      >
        <div
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
          className="relative aspect-[9/16] max-h-[300px] w-full bg-zinc-100"
        >
          {item.asset_url ? (
            <ReelMedia
              ref={videoRef}
              src={item.asset_url}
              muted
              loop
              preload="metadata"
              className="h-full w-full object-cover"
              iframeClassName="h-full w-full border-0 pointer-events-none"
            />
          ) : (
            <div className="app-subtle flex h-full w-full items-center justify-center text-xs">
              No preview
            </div>
          )}
          {approved && (
            <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/85 text-white">
              <div className="flex flex-col items-center gap-1">
                <Check className="h-8 w-8" />
                <span className="text-sm font-medium">Approved</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex items-center gap-2">
            {item.platform && (
              <span className="app-subtle text-[11px] font-medium uppercase tracking-wide">
                {item.platform}
              </span>
            )}
            <StatusBadge
              status={item.status}
              variant="content"
              className="bg-transparent px-0 text-zinc-500"
            />
          </div>

          <p className="app-heading line-clamp-2 text-sm font-semibold">
            {item.title}
          </p>
          {item.caption && (
            <p className="app-subtle line-clamp-3 text-xs">
              {item.caption}
            </p>
          )}
          {item.scheduled_for && (
            <p className="app-subtle text-[11px]">
              Scheduled: {formatDate(item.scheduled_for)}
            </p>
          )}

          {isPending && (
            <div className="mt-2 flex gap-2 pt-1">
              <Button
                size="sm"
                onClick={approve}
                disabled={approving || approved}
                className="flex-1 bg-emerald-600 text-white shadow-none hover:bg-emerald-700"
              >
                {approving && !approved ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  setDialogOpen(true)
                }}
                disabled={approving || approved}
                className="flex-1 border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
              >
                Request changes
              </Button>
            </div>
          )}
        </div>
      </div>

      <RequestChangesDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={requestChanges}
        itemTitle={item.title}
      />
    </>
  )
}
