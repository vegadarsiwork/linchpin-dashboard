'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { UploadButton } from '@/lib/uploadthing'
import type { InfluencerReel } from '@/lib/types'
import { cn } from '@/lib/utils'

function fieldClass() {
  return 'h-10 w-full rounded-md border border-zinc-200 bg-[#fbfaf7] px-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-[#7c3aed] focus:bg-white focus:ring-2 focus:ring-violet-100'
}

const panelClass = 'rounded-lg border border-zinc-200/80 bg-white shadow-sm'

function arrayFromText(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean)
}

function isVideoPreviewUrl(url: string | null | undefined) {
  if (!url) return false
  return Boolean(url.toLowerCase().split('?')[0].match(/\.(mp4|webm|mov)$/))
}

function StatusBadge({ status }: { status: string }) {
  const STATUS_COPY: Record<string, { label: string; cls: string }> = {
    draft: { label: 'Draft', cls: 'bg-zinc-100 text-zinc-700 ring-zinc-200' },
    pending_review: { label: 'Pending review', cls: 'bg-amber-50 text-amber-800 ring-amber-200' },
    approved: { label: 'Approved', cls: 'bg-emerald-50 text-emerald-800 ring-emerald-200' },
    rejected: { label: 'Needs changes', cls: 'bg-red-50 text-red-800 ring-red-200' },
  }
  const meta = STATUS_COPY[status] ?? STATUS_COPY.draft
  return <span className={cn('rounded-md px-2.5 py-1 text-xs font-semibold ring-1', meta.cls)}>{meta.label}</span>
}

type Props = {
  initialReels: InfluencerReel[]
}

export function InfluencerPortfolioManager({ initialReels }: Props) {
  const [localReels, setLocalReels] = useState(() =>
    [...initialReels].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
  )
  const [reelForm, setReelForm] = useState({ title: '', preview_url: '', original_url: '', category_tags: '', is_featured: true })

  async function addReel(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/influencer/reels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: reelForm.title,
        preview_url: reelForm.preview_url,
        original_url: reelForm.original_url,
        category_tags: arrayFromText(reelForm.category_tags),
        is_featured: reelForm.is_featured,
      }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast.error(json.error ?? 'Could not add trial reel')
      return
    }
    setLocalReels((current) => [
      json.reel as InfluencerReel,
      ...current.map((reel) => reelForm.is_featured ? { ...reel, is_featured: false } : reel),
    ])
    setReelForm({ title: '', preview_url: '', original_url: '', category_tags: '', is_featured: true })
    toast.success('Trial reel added for review')
  }

  async function deleteReel(id: string) {
    if (!window.confirm('Delete this item?')) return
    const res = await fetch('/api/influencer/reels', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      toast.error(json.error ?? 'Could not delete reel')
      return
    }
    setLocalReels((current) => current.filter((r) => r.id !== id))
    toast.success('Reel deleted')
  }

  async function moveReel(id: string, direction: 'up' | 'down') {
    const res = await fetch('/api/influencer/reels', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, direction }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast.error(json.error ?? 'Could not reorder reel')
      return
    }
    // Swap positions in local state
    setLocalReels((current) => {
      const sorted = [...current].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
      const idx = sorted.findIndex((r) => r.id === id)
      if (idx < 0) return current
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1
      if (swapIdx < 0 || swapIdx >= sorted.length) return current
      const next = [...sorted]
      const aOrder = next[idx].display_order
      const bOrder = next[swapIdx].display_order
      next[idx] = { ...next[idx], display_order: bOrder }
      next[swapIdx] = { ...next[swapIdx], display_order: aOrder }
      return next.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
    })
    // If the server returned updated reels, use those instead
    if (json.reels) {
      setLocalReels([...(json.reels as InfluencerReel[])].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)))
    }
  }

  const sortedReels = [...localReels].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))

  return (
    <div className="space-y-5" id="portfolio">
      <form onSubmit={addReel} className={cn(panelClass, 'p-5')}>
        <h2 className="text-lg font-semibold text-zinc-950">Trial reels</h2>
        <p className="mt-1 text-sm text-zinc-500">Upload a short MP4/WebM preview here. It autoplays muted in the marketplace like a reel preview. Keep full-quality originals in a private Drive link.</p>
        <div className="mt-4 space-y-3">
          <input className={fieldClass()} value={reelForm.title} onChange={(e) => setReelForm({ ...reelForm, title: e.target.value })} placeholder="Reel title" />
          <UploadButton
            endpoint="trialReelPreview"
            onClientUploadComplete={(files) => {
              const url = files[0]?.ufsUrl ?? files[0]?.url
              if (!url) return
              setReelForm((current) => ({ ...current, preview_url: url }))
              toast.success('Trial reel preview uploaded')
            }}
            onUploadError={(error) => { toast.error(error.message) }}
            appearance={{
              button: 'ut-ready:bg-zinc-950 ut-ready:text-white ut-ready:hover:bg-zinc-800 ut-uploading:bg-zinc-400 rounded-md px-3 text-xs font-semibold',
              allowedContent: 'text-xs text-zinc-500',
            }}
          />
          <p className="text-xs text-zinc-500">UploadThing accepts image/GIF previews up to 8MB or video previews up to 16MB. The uploaded URL fills this field automatically.</p>
          <input className={fieldClass()} value={reelForm.preview_url} onChange={(e) => setReelForm({ ...reelForm, preview_url: e.target.value })} placeholder="Preview URL from UploadThing or direct MP4/WebM/image URL" required />
          <input className={fieldClass()} value={reelForm.original_url} onChange={(e) => setReelForm({ ...reelForm, original_url: e.target.value })} placeholder="Optional full-quality Drive link" />
          <input className={fieldClass()} value={reelForm.category_tags} onChange={(e) => setReelForm({ ...reelForm, category_tags: e.target.value })} placeholder="skincare, tutorial" />
          <label className="flex items-center gap-2 text-sm text-zinc-600">
            <input type="checkbox" checked={reelForm.is_featured} onChange={(e) => setReelForm({ ...reelForm, is_featured: e.target.checked })} />
            Featured preview
          </label>
          <button className="inline-flex h-10 items-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 active:translate-y-px">
            <Plus className="h-4 w-4" /> Add trial reel
          </button>
        </div>
      </form>

      <div className="grid grid-cols-2 gap-3">
        {sortedReels.map((reel, idx) => {
          const src = reel.gif_url || reel.video_url || reel.thumbnail_url
          const isVideo = Boolean(reel.video_url) || isVideoPreviewUrl(src)
          const isFirst = idx === 0
          const isLast = idx === sortedReels.length - 1
          return (
            <div key={reel.id} className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
              <div className="aspect-[9/16] bg-zinc-100">
                {src && isVideo ? (
                  <video src={src} autoPlay muted loop playsInline className="h-full w-full object-cover" />
                ) : src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt={reel.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-zinc-400">No preview</div>
                )}
              </div>
              <div className="space-y-2 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{reel.title}</div>
                    {reel.is_featured && <div className="text-xs text-zinc-500">Featured sample</div>}
                  </div>
                  <StatusBadge status={reel.approval_status} />
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={isFirst}
                    onClick={() => moveReel(reel.id, 'up')}
                    className="inline-flex h-7 w-7 items-center justify-center rounded border border-zinc-200 text-xs text-zinc-600 hover:bg-zinc-50 disabled:opacity-30"
                    title="Move up"
                  >↑</button>
                  <button
                    type="button"
                    disabled={isLast}
                    onClick={() => moveReel(reel.id, 'down')}
                    className="inline-flex h-7 w-7 items-center justify-center rounded border border-zinc-200 text-xs text-zinc-600 hover:bg-zinc-50 disabled:opacity-30"
                    title="Move down"
                  >↓</button>
                  <button
                    type="button"
                    onClick={() => deleteReel(reel.id)}
                    className="ml-auto inline-flex h-7 items-center rounded px-2 text-xs font-medium text-red-600 hover:bg-red-50"
                  >Delete</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
