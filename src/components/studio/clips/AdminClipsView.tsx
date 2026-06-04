'use client'

import { useState } from 'react'
import { Plus, CheckCircle2, AlertTriangle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AddClipSlideOver } from './AddClipSlideOver'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils/dates'
import type { ClipWithRelations, ClipApprovalElement, ClipElementType } from '@/lib/types'

const ELEMENT_LABELS: Record<ClipElementType, string> = {
  background_location: 'BG / Location',
  voice_audio: 'Voice / Audio',
  influencer_presence: 'Influencer',
}

const ELEMENT_TYPES: ClipElementType[] = [
  'background_location',
  'voice_audio',
  'influencer_presence',
]

const CLIP_STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pending:            { bg: 'bg-zinc-100',   text: 'text-zinc-600',   label: 'Pending' },
  partially_reviewed: { bg: 'bg-amber-100',  text: 'text-amber-700',  label: 'In review' },
  approved:           { bg: 'bg-emerald-100',text: 'text-emerald-700',label: 'Approved' },
  changes_requested:  { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Changes requested' },
}

type CampaignOpt = { id: string; name: string }

export type AdminClipsViewProps = {
  orgId: string
  initialClips: ClipWithRelations[]
  campaigns: CampaignOpt[]
}

function ElementCell({ element }: { element: ClipApprovalElement | undefined }) {
  if (!element || element.status === 'pending') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400">
        <Clock className="h-3 w-3" />
        Pending
      </span>
    )
  }
  if (element.status === 'approved') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700">
        <CheckCircle2 className="h-3 w-3" />
        Approved
      </span>
    )
  }
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] text-amber-700"
      title={element.comment ?? undefined}
    >
      <AlertTriangle className="h-3 w-3" />
      Flagged
      {element.comment && (
        <span className="ml-0.5 text-[10px] text-amber-600 max-w-[120px] truncate">
          — {element.comment}
        </span>
      )}
    </span>
  )
}

export function AdminClipsView({ orgId, initialClips, campaigns }: AdminClipsViewProps) {
  const [clips, setClips] = useState<ClipWithRelations[]>(initialClips)
  const [slideOpen, setSlideOpen] = useState(false)

  async function reload() {
    try {
      const res = await fetch(`/api/admin/clips?org_id=${orgId}`)
      const data = await res.json() as { clips: ClipWithRelations[] }
      setClips(data.clips ?? [])
    } catch {
      // silently ignore
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="app-subtle text-sm">{clips.length} clip{clips.length !== 1 ? 's' : ''}</p>
        <Button size="sm" onClick={() => setSlideOpen(true)}>
          <Plus className="h-4 w-4" />
          Add clip
        </Button>
      </div>

      {clips.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center">
          <p className="text-sm text-zinc-500">No clips added yet. Add one to start the approval flow.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500">Clip</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500">Campaign</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500">Status</th>
                {ELEMENT_TYPES.map((et) => (
                  <th
                    key={et}
                    className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 hidden lg:table-cell"
                  >
                    {ELEMENT_LABELS[et]}
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {clips.map((clip) => {
                const style = CLIP_STATUS_STYLES[clip.status] ?? CLIP_STATUS_STYLES.pending
                return (
                  <tr key={clip.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-zinc-900 max-w-[200px] truncate">
                        {clip.title}
                      </div>
                      {clip.admin_notes && (
                        <p className="text-[11px] text-zinc-400 mt-0.5 truncate max-w-[200px]">
                          {clip.admin_notes}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 text-sm">
                      {clip.campaign_name ?? <span className="text-zinc-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                          style.bg,
                          style.text
                        )}
                      >
                        {style.label}
                      </span>
                      {clip.status === 'changes_requested' && clip.admin_notes && (
                        <p className="mt-1 text-[11px] text-red-600 max-w-[160px] line-clamp-2">
                          {clip.admin_notes}
                        </p>
                      )}
                    </td>
                    {ELEMENT_TYPES.map((et) => {
                      const el = clip.elements.find((e) => e.element_type === et)
                      return (
                        <td key={et} className="px-4 py-3 hidden lg:table-cell">
                          <ElementCell element={el} />
                        </td>
                      )
                    })}
                    <td className="px-4 py-3 text-zinc-500 text-xs whitespace-nowrap">
                      {formatDate(clip.created_at)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <AddClipSlideOver
        open={slideOpen}
        onOpenChange={setSlideOpen}
        orgId={orgId}
        campaigns={campaigns}
        onAdded={reload}
      />
    </div>
  )
}
