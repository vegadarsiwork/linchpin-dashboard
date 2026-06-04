'use client'

import { Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils/dates'
import type { ContentItemVersion } from '@/lib/types'

type Props = {
  versions: ContentItemVersion[]
  onDownloadVersion: (version: ContentItemVersion) => void
}

export function ReelVersionHistory({ versions, onDownloadVersion }: Props) {
  if (versions.length === 0) return null

  return (
    <div className="mt-4 border-t border-zinc-100 pt-4">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
        Version history
      </p>
      <ul className="space-y-1.5">
        {versions.map((v, idx) => (
          <li
            key={v.id}
            className={cn(
              'app-muted-panel flex items-center justify-between rounded-md px-2.5 py-1.5',
              idx === 0 && 'border-violet-200 bg-violet-50'
            )}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-zinc-900">
                  {v.label ?? `v${v.version_number}`}
                </span>
                {idx === 0 && (
                  <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">
                    Latest
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[11px] text-zinc-500">
                {formatDate(v.created_at)}
              </p>
            </div>
            {(v.full_quality_url || v.asset_url) && (
              <button
                type="button"
                onClick={() => onDownloadVersion(v)}
                className="app-icon-surface ml-2 shrink-0 rounded p-1 text-zinc-500 hover:text-zinc-700"
                title="Download this version"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
