'use client'

import { useRef, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatDateShort } from '@/lib/utils/dates'
import { RequestChangesDialog } from './RequestChangesDialog'
import { ReelMedia } from '@/components/studio/reels/ReelMedia'
import type { ContentItem } from '@/lib/types'

export type ReelCardProps = {
  item: ContentItem
  onResolved: (id: string) => void
}

export function ReelCard({ item, onResolved }: ReelCardProps) {
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

  async function approve() {
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
      // Animate out, then remove from parent list
      setTimeout(() => onResolved(item.id), 600)
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
      onResolved(item.id)
    } catch {
      toast.error('Could not send feedback. Try again.')
    }
  }

  return (
    <>
      <div
        className={cn(
          'group flex flex-col overflow-hidden rounded-lg border border-zinc-200/70 bg-white shadow-sm transition-all',
          approved && 'border-emerald-300 ring-2 ring-emerald-100'
        )}
      >
        <div
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
          className="relative aspect-[9/16] w-full bg-zinc-100"
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
            <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400">
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

        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-900">
              {item.title}
            </p>
            {item.caption && (
              <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
                {item.caption}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-zinc-500">
            {item.platform && (
              <span className="inline-flex rounded bg-zinc-100 px-1.5 py-0.5 font-medium text-zinc-700 capitalize">
                {item.platform}
              </span>
            )}
            {item.scheduled_for && (
              <span>· {formatDateShort(item.scheduled_for)}</span>
            )}
          </div>

          <div className="mt-auto flex gap-2 pt-1">
            <Button
              size="sm"
              onClick={approve}
              disabled={approving || approved}
              className="flex-1 bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
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
              onClick={() => setDialogOpen(true)}
              disabled={approving || approved}
              className="flex-1"
            >
              Request changes
            </Button>
          </div>
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
