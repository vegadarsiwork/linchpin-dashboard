'use client'

import { useState } from 'react'
import { Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Props = {
  reelId: string
  onUploaded: (nextStatus: string) => void
}

export function ReelAdminVersionUpload({ reelId, onUploaded }: Props) {
  const [assetUrl, setAssetUrl] = useState('')
  const [fullQualityUrl, setFullQualityUrl] = useState('')
  const [label, setLabel] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [expanded, setExpanded] = useState(false)

  async function handleSubmit() {
    if (!assetUrl.trim() && !fullQualityUrl.trim()) {
      toast.error('Add at least one URL.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/reels/${reelId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_url: assetUrl.trim() || null,
          full_quality_url: fullQualityUrl.trim() || null,
          label: label.trim() || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Upload failed')
      }
      toast.success('New version delivered. Client notified.')
      setAssetUrl('')
      setFullQualityUrl('')
      setLabel('')
      setExpanded(false)
      onUploaded('correction_submitted')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not upload version')
    } finally {
      setSubmitting(false)
    }
  }

  if (!expanded) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setExpanded(true)}
        className="w-full border-dashed border-amber-300 text-amber-700 hover:bg-amber-50"
      >
        <Upload className="h-3.5 w-3.5" />
        Upload corrected version
      </Button>
    )
  }

  return (
    <div className="app-muted-panel rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2.5">
      <p className="text-xs font-semibold text-amber-900">Upload corrected version</p>

      <div className="space-y-1">
        <Label htmlFor="v-preview" className="text-xs">Preview / player URL</Label>
        <Input
          id="v-preview"
          value={assetUrl}
          onChange={(e) => setAssetUrl(e.target.value)}
          placeholder="Small MP4, GIF, or embed URL"
          className="app-input h-8 text-xs"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="v-quality" className="text-xs">Full-quality delivery link</Label>
        <Input
          id="v-quality"
          value={fullQualityUrl}
          onChange={(e) => setFullQualityUrl(e.target.value)}
          placeholder="Google Drive, Dropbox, Frame.io…"
          className="app-input h-8 text-xs"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="v-label" className="text-xs">Version label (optional)</Label>
        <Input
          id="v-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. v2 – colour corrected"
          className="app-input h-8 text-xs"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setExpanded(false)}
          disabled={submitting}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={submitting || (!assetUrl.trim() && !fullQualityUrl.trim())}
          className="flex-1 bg-amber-600 text-white hover:bg-amber-700"
        >
          {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Deliver
        </Button>
      </div>
    </div>
  )
}
