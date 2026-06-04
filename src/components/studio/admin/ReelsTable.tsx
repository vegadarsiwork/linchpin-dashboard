'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/studio/StatusBadge'
import { EmptyState } from '@/components/studio/EmptyState'
import { UploadReelSlideOver } from './UploadReelSlideOver'
import { formatDate } from '@/lib/utils/dates'
import { ReelMedia } from '@/components/studio/reels/ReelMedia'
import type { ContentItem } from '@/lib/types'

type Lite = { id: string; name?: string; handle?: string | null; title?: string }

export type ReelsTableProps = {
  orgId: string
  items: ContentItem[]
  scripts: { id: string; title: string }[]
  influencers: { id: string; name: string; handle: string | null }[]
  scriptMap: Record<string, Lite>
  influencerMap: Record<string, Lite>
}

export function ReelsTable({
  orgId,
  items,
  scripts,
  influencers,
  scriptMap,
  influencerMap,
}: ReelsTableProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Upload reel
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          iconKey="fileVideo"
          title="No reels yet"
          description="Upload the first reel for this client."
          action={{ label: 'Upload reel', onClick: () => setOpen(true) }}
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200/70 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-[11px] uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Preview</th>
                <th className="px-4 py-2.5 font-medium">Title</th>
                <th className="px-4 py-2.5 font-medium">Platform</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Scheduled</th>
                <th className="px-4 py-2.5 font-medium">Influencer</th>
                <th className="px-4 py-2.5 font-medium">Script</th>
                <th className="px-4 py-2.5 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {items.map((item) => {
                const inf = item.influencer_id ? influencerMap[item.influencer_id] : null
                const sc = item.script_id ? scriptMap[item.script_id] : null
                return (
                  <tr key={item.id} className="hover:bg-zinc-50/60">
                    <td className="px-4 py-2.5">
                      <div className="h-14 w-9 overflow-hidden rounded bg-black">
                        {item.asset_url ? (
                          <ReelMedia
                            src={item.asset_url}
                            muted
                            preload="metadata"
                            className="h-full w-full object-cover"
                            iframeClassName="h-full w-full border-0 pointer-events-none"
                          />
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 max-w-[260px]">
                      <p className="truncate font-medium text-zinc-900">{item.title}</p>
                    </td>
                    <td className="px-4 py-2.5 capitalize text-zinc-700">
                      {item.platform ?? '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={item.status} variant="content" />
                    </td>
                    <td className="px-4 py-2.5 text-zinc-700 tabular-nums">
                      {item.scheduled_for ? formatDate(item.scheduled_for) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-zinc-700">
                      {inf ? `${inf.name}${inf.handle ? ` · ${inf.handle}` : ''}` : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-zinc-700 max-w-[180px]">
                      <span className="block truncate">{sc?.title ?? '—'}</span>
                    </td>
                    <td className="px-4 py-2.5 text-zinc-500 tabular-nums">
                      {formatDate(item.created_at)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <UploadReelSlideOver
        open={open}
        onOpenChange={setOpen}
        orgId={orgId}
        scripts={scripts}
        influencers={influencers}
        onUploaded={() => router.refresh()}
      />
    </div>
  )
}
