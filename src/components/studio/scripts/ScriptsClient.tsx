'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { FileText, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Script } from '@/lib/types'

type ScriptWithCampaign = Script & { campaigns: { id: string; name: string } | null }

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  pending_review: 'Pending Review',
  under_review: 'Under Review',
  changes_requested: 'Changes Requested',
  revised: 'Revised',
  approved: 'Approved',
}

const STATUS_CLASSES: Record<string, string> = {
  draft: 'bg-zinc-100 text-zinc-600',
  pending_review: 'bg-amber-100 text-amber-700',
  under_review: 'bg-blue-100 text-blue-700',
  changes_requested: 'bg-orange-100 text-orange-700',
  revised: 'bg-violet-100 text-violet-700',
  approved: 'bg-emerald-100 text-emerald-700',
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold',
        STATUS_CLASSES[status] ?? 'bg-zinc-100 text-zinc-600'
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}

interface Props {
  initial: ScriptWithCampaign[]
  campaigns: { id: string; name: string }[]
}

export function ScriptsClient({ initial, campaigns }: Props) {
  const [statusFilter, setStatusFilter] = useState('all')
  const [campaignFilter, setCampaignFilter] = useState('all')
  const [sort, setSort] = useState<'created_at' | 'title' | 'status'>('created_at')
  const [order, setOrder] = useState<'desc' | 'asc'>('desc')

  const filtered = useMemo(() => {
    let list = [...initial]
    if (statusFilter !== 'all') list = list.filter((s) => s.status === statusFilter)
    if (campaignFilter !== 'all') list = list.filter((s) => s.campaign_id === campaignFilter)
    list.sort((a, b) => {
      let av = a[sort] as string
      let bv = b[sort] as string
      av = av ?? ''
      bv = bv ?? ''
      return order === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })
    return list
  }, [initial, statusFilter, campaignFilter, sort, order])

  function toggleSort(col: typeof sort) {
    if (sort === col) setOrder((o) => (o === 'asc' ? 'desc' : 'asc'))
    else { setSort(col); setOrder('desc') }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="app-heading text-xl font-semibold">Scripts</h1>
          <p className="app-subtle mt-0.5 text-sm">Review and approve your campaign scripts.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="app-panel flex flex-wrap gap-3 rounded-lg p-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="app-input rounded-md px-2.5 py-1.5 text-sm"
        >
          <option value="all">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>

        <select
          value={campaignFilter}
          onChange={(e) => setCampaignFilter(e.target.value)}
          className="app-input rounded-md px-2.5 py-1.5 text-sm"
        >
          <option value="all">All campaigns</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          value={`${sort}:${order}`}
          onChange={(e) => {
            const [s, o] = e.target.value.split(':')
            setSort(s as typeof sort)
            setOrder(o as typeof order)
          }}
          className="app-input rounded-md px-2.5 py-1.5 text-sm"
        >
          <option value="created_at:desc">Newest first</option>
          <option value="created_at:asc">Oldest first</option>
          <option value="title:asc">Title A–Z</option>
          <option value="title:desc">Title Z–A</option>
          <option value="status:asc">Status</option>
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="app-panel rounded-lg p-12 text-center">
          <FileText className="mx-auto mb-3 h-8 w-8 text-zinc-300" />
          <p className="app-subtle text-sm">No scripts found.</p>
        </div>
      ) : (
        <div className="app-panel overflow-hidden rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th
                  className="cursor-pointer px-4 py-3 text-left font-medium"
                  onClick={() => toggleSort('title')}
                >
                  Title {sort === 'title' && (order === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3 text-left font-medium">Campaign</th>
                <th
                  className="cursor-pointer px-4 py-3 text-left font-medium"
                  onClick={() => toggleSort('created_at')}
                >
                  Date {sort === 'created_at' && (order === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  className="cursor-pointer px-4 py-3 text-left font-medium"
                  onClick={() => toggleSort('status')}
                >
                  Status {sort === 'status' && (order === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map((s) => (
                <tr key={s.id} className="transition-colors hover:bg-zinc-50">
                  <td className="px-4 py-3 font-medium text-zinc-900">{s.title}</td>
                  <td className="px-4 py-3 text-zinc-500">
                    {s.campaigns?.name ?? <span className="text-zinc-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {new Date(s.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/scripts/${s.id}`}
                      className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-violet-700 hover:bg-violet-50"
                    >
                      View <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
