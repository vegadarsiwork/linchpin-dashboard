'use client'

import { useState } from 'react'
import { Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { HashtagInput } from './HashtagInput'
import { cn } from '@/lib/utils'

const PLATFORMS = [
  { value: 'instagram', label: 'Instagram Reel' },
  { value: 'youtube', label: 'YouTube Short' },
  { value: 'tiktok', label: 'TikTok' },
]

type ScriptOpt = { id: string; title: string }
type InfluencerOpt = { id: string; name: string; handle: string | null }

export type UploadReelSlideOverProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  orgId: string
  scripts: ScriptOpt[]
  influencers: InfluencerOpt[]
  onUploaded: () => void
}

export function UploadReelSlideOver({
  open,
  onOpenChange,
  orgId,
  scripts,
  influencers,
  onUploaded,
}: UploadReelSlideOverProps) {
  const [submitting, setSubmitting] = useState(false)
  const [title, setTitle] = useState('')
  const [platform, setPlatform] = useState('instagram')
  const [caption, setCaption] = useState('')
  const [hashtags, setHashtags] = useState<string[]>([])
  const [scheduledFor, setScheduledFor] = useState('')
  const [scriptId, setScriptId] = useState('')
  const [influencerId, setInfluencerId] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [fullQualityUrl, setFullQualityUrl] = useState('')

  function reset() {
    setSubmitting(false)
    setTitle('')
    setPlatform('instagram')
    setCaption('')
    setHashtags([])
    setScheduledFor('')
    setScriptId('')
    setInfluencerId('')
    setPreviewUrl('')
    setFullQualityUrl('')
  }

  async function handleSubmit() {
    if (!title.trim()) {
      toast.error('Title is required.')
      return
    }
    if (!previewUrl.trim()) {
      toast.error('Add a preview/player URL for dashboard review.')
      return
    }
    if (!fullQualityUrl.trim()) {
      toast.error('Add the full-quality delivery link.')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: orgId,
          title: title.trim(),
          platform,
          caption: caption.trim() || null,
          hashtags,
          asset_url: previewUrl.trim(),
          full_quality_url: fullQualityUrl.trim(),
          asset_type: 'video',
          asset_size_mb: null,
          scheduled_for: scheduledFor || null,
          script_id: scriptId || null,
          influencer_id: influencerId || null,
          status: 'pending_approval',
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Create failed')
      }

      toast.success('Reel added. Client notified.')
      reset()
      onOpenChange(false)
      onUploaded()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not add reel')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!submitting) { if (!o) reset(); onOpenChange(o) } }}>
      <SheetContent className="max-w-xl">
        <SheetHeader>
          <SheetTitle>Add reel delivery</SheetTitle>
          <SheetDescription>
            Add a lightweight preview for dashboard review and a private full-quality delivery link.
          </SheetDescription>
        </SheetHeader>

        <SheetBody>
          <div className="space-y-4">
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-medium text-zinc-900">Storage model</p>
              <p className="mt-1 text-sm text-zinc-500">
                Full-quality reels are delivered through Google Drive or another private link. App storage is reserved for profile photos and small trial reel previews.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preview">Preview/player URL</Label>
              <Input
                id="preview"
                value={previewUrl}
                onChange={(e) => setPreviewUrl(e.target.value)}
                placeholder="Small MP4 preview, GIF, or embeddable player URL"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_quality">Full-quality delivery link</Label>
              <Input
                id="full_quality"
                value={fullQualityUrl}
                onChange={(e) => setFullQualityUrl(e.target.value)}
                placeholder="Google Drive, Dropbox, Frame.io, or other private link"
              />
            </div>

            <div className="space-y-2">
              <Label>Platform</Label>
              <div className="grid grid-cols-3 gap-2">
                {PLATFORMS.map((p) => (
                  <label
                    key={p.value}
                    className={cn(
                      'flex cursor-pointer items-center justify-center rounded-md border px-3 py-2 text-xs font-medium',
                      platform === p.value
                        ? 'border-violet-300 bg-violet-50 text-[#7C3AED]'
                        : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'
                    )}
                  >
                    <input
                      type="radio"
                      name="platform"
                      value={p.value}
                      checked={platform === p.value}
                      onChange={() => setPlatform(p.value)}
                      className="sr-only"
                    />
                    {p.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="caption">Caption</Label>
              <Textarea id="caption" value={caption} onChange={(e) => setCaption(e.target.value)} rows={4} />
            </div>

            <div className="space-y-2">
              <Label>Hashtags</Label>
              <HashtagInput value={hashtags} onChange={setHashtags} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduled_for">Scheduled for</Label>
              <Input id="scheduled_for" type="datetime-local" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="script">Script</Label>
                <select
                  id="script"
                  value={scriptId}
                  onChange={(e) => setScriptId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-2 text-sm focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-violet-100"
                >
                  <option value="">None</option>
                  {scripts.map((s) => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="influencer">Influencer</Label>
                <select
                  id="influencer"
                  value={influencerId}
                  onChange={(e) => setInfluencerId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-2 text-sm focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-violet-100"
                >
                  <option value="">None</option>
                  {influencers.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}{i.handle ? ` - ${i.handle}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </SheetBody>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || !previewUrl.trim() || !fullQualityUrl.trim() || submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Add &amp; notify client
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
