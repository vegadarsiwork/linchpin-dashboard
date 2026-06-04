'use client'

import { useState } from 'react'
import { Loader2, Plus } from 'lucide-react'
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

type CampaignOpt = { id: string; name: string }

export type AddClipSlideOverProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  orgId: string
  campaigns: CampaignOpt[]
  onAdded: () => void
}

export function AddClipSlideOver({
  open,
  onOpenChange,
  orgId,
  campaigns,
  onAdded,
}: AddClipSlideOverProps) {
  const [submitting, setSubmitting] = useState(false)
  const [title, setTitle] = useState('')
  const [campaignId, setCampaignId] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [fullQualityUrl, setFullQualityUrl] = useState('')
  const [durationSeconds, setDurationSeconds] = useState('')
  const [adminNotes, setAdminNotes] = useState('')

  function reset() {
    setSubmitting(false)
    setTitle('')
    setCampaignId('')
    setPreviewUrl('')
    setFullQualityUrl('')
    setDurationSeconds('')
    setAdminNotes('')
  }

  async function handleSubmit() {
    if (!title.trim()) {
      toast.error('Title is required.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/clips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: orgId,
          title: title.trim(),
          campaign_id: campaignId || null,
          preview_url: previewUrl.trim() || null,
          full_quality_url: fullQualityUrl.trim() || null,
          duration_seconds: durationSeconds ? parseInt(durationSeconds, 10) : null,
          admin_notes: adminNotes.trim() || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(err.error || 'Create failed')
      }
      toast.success('Clip added. Client can now review it.')
      reset()
      onOpenChange(false)
      onAdded()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not add clip')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!submitting) {
          if (!o) reset()
          onOpenChange(o)
        }
      }}
    >
      <SheetContent className="max-w-xl">
        <SheetHeader>
          <SheetTitle>Add clip for review</SheetTitle>
          <SheetDescription>
            Upload a clip for client pre-reel approval.
          </SheetDescription>
        </SheetHeader>

        <SheetBody>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clip-title">Title *</Label>
              <Input
                id="clip-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Café scene — take 3"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clip-campaign">Campaign</Label>
              <select
                id="clip-campaign"
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-2 text-sm focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-violet-100"
              >
                <option value="">No campaign</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clip-preview">Preview URL</Label>
              <Input
                id="clip-preview"
                value={previewUrl}
                onChange={(e) => setPreviewUrl(e.target.value)}
                placeholder="MP4, GIF, or embeddable player URL"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clip-full">Full-quality delivery link</Label>
              <Input
                id="clip-full"
                value={fullQualityUrl}
                onChange={(e) => setFullQualityUrl(e.target.value)}
                placeholder="Google Drive, Dropbox, Frame.io, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clip-duration">Duration (seconds)</Label>
              <Input
                id="clip-duration"
                type="number"
                min={0}
                value={durationSeconds}
                onChange={(e) => setDurationSeconds(e.target.value)}
                placeholder="e.g. 45"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clip-notes">Admin notes</Label>
              <Textarea
                id="clip-notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Internal notes for the team…"
                rows={3}
              />
            </div>
          </div>
        </SheetBody>

        <SheetFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Add clip
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
