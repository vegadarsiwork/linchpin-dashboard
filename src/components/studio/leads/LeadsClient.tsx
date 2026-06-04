'use client'

import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Plus, Mail, Phone, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Lead } from '@/lib/types'
import { StatusBadge } from '@/components/studio/StatusBadge'
import { Button } from '@/components/ui/button'
import { LeadDrawer } from './LeadDrawer'
import { AddLeadModal } from './AddLeadModal'
import {
  LEAD_STATUSES,
  type LeadStatus,
  getSourceMeta,
  followUpState,
  followUpToneClasses,
} from './leadConstants'

type StatusFilter = 'all' | LeadStatus
type SortKey = 'latest' | 'follow_up' | 'source'

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  ...LEAD_STATUSES.map((s) => ({ key: s.key, label: s.label })),
]

export function LeadsClient({ initial }: { initial: Lead[] }) {
  const router = useRouter()
  const search = useSearchParams()
  const initialOpenId = search.get('lead')

  const [leads, setLeads] = useState<Lead[]>(initial)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('latest')
  const [query, setQuery] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [drawerOpenId, setDrawerOpenId] = useState<string | null>(initialOpenId)

  // Strip ?lead= from URL once we've consumed it so refresh doesn't re-pop drawer.
  useEffect(() => {
    if (!initialOpenId) return
    router.replace('/dashboard/leads', { scroll: false })
  }, [initialOpenId, router])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let rows = leads

    if (statusFilter !== 'all') {
      rows = rows.filter((l) => l.status === statusFilter)
    }

    if (q) {
      rows = rows.filter((l) => {
        const hay = `${l.name ?? ''} ${l.phone ?? ''} ${l.email ?? ''}`.toLowerCase()
        return hay.includes(q)
      })
    }

    rows = [...rows].sort((a, b) => {
      if (sortKey === 'latest') {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      }
      if (sortKey === 'follow_up') {
        const at = a.follow_up_at ? new Date(a.follow_up_at).getTime() : Infinity
        const bt = b.follow_up_at ? new Date(b.follow_up_at).getTime() : Infinity
        return at - bt
      }
      return (a.source ?? 'zzz').localeCompare(b.source ?? 'zzz')
    })

    return rows
  }, [leads, statusFilter, sortKey, query])

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: leads.length }
    for (const s of LEAD_STATUSES) map[s.key] = 0
    for (const l of leads) {
      if (map[l.status] !== undefined) map[l.status] += 1
    }
    return map
  }, [leads])

  const drawerLead = drawerOpenId
    ? leads.find((l) => l.id === drawerOpenId) ?? null
    : null

  function handleCreated(lead: Lead) {
    setLeads((curr) => [lead, ...curr])
    setDrawerOpenId(lead.id)
  }

  function handleUpdate(updated: Lead) {
    setLeads((curr) => curr.map((l) => (l.id === updated.id ? updated : l)))
  }

  function handleDelete(id: string) {
    setLeads((curr) => curr.filter((l) => l.id !== id))
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Leads
          </h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            {leads.length} total — track sources, statuses, and follow-ups.
          </p>
        </div>
        <Button variant="outline" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Lead
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex gap-1 overflow-x-auto border-b border-zinc-200 pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {STATUS_FILTERS.map((s) => {
            const active = statusFilter === s.key
            const count = counts[s.key] ?? 0
            return (
              <button
                key={s.key}
                onClick={() => setStatusFilter(s.key)}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition-colors',
                  active
                    ? 'border-violet-600 text-violet-700'
                    : 'border-transparent text-zinc-500 hover:text-zinc-900'
                )}
              >
                {s.label}
                <span
                  className={cn(
                    'tabular-nums',
                    active ? 'text-violet-700' : 'text-zinc-500'
                  )}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row lg:ml-auto">
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="app-input h-9 rounded-md px-3 text-sm"
          >
            <option value="latest">Latest first</option>
            <option value="follow_up">Follow-up due soonest</option>
            <option value="source">Source</option>
          </select>
          <div className="relative">
            <Search className="app-subtle pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
              placeholder="Search name, phone, email…"
              className="app-input h-9 w-full rounded-md pl-8 pr-3 text-sm sm:w-64"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="app-muted-panel overflow-x-auto rounded-lg">
        <table className="min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50/60 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Follow-up</th>
              <th className="px-4 py-3">Notes</th>
              <th className="px-4 py-3 text-right">Contact</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-16 text-center text-sm text-zinc-500"
                >
                  {leads.length === 0
                    ? 'No leads yet — add one to get started.'
                    : 'No leads match these filters.'}
                </td>
              </tr>
            ) : (
              filtered.map((lead) => (
                <LeadRow
                  key={lead.id}
                  lead={lead}
                  onClick={() => setDrawerOpenId(lead.id)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <LeadDrawer
        lead={drawerLead}
        open={Boolean(drawerLead)}
        onClose={() => setDrawerOpenId(null)}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />

      <AddLeadModal
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={handleCreated}
      />
    </div>
  )
}

function LeadRow({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  const sourceMeta = getSourceMeta(lead.source)
  const fu = followUpState(lead.follow_up_at)

  return (
    <tr
      onClick={onClick}
      className="group cursor-pointer border-b border-zinc-100 border-l-2 border-l-transparent transition-colors last:border-b-0 hover:border-l-[#7C3AED] hover:bg-violet-50/40"
    >
      <td className="px-4 py-3">
        <div className="font-medium text-zinc-900">
          {lead.name ?? (
            <span className="italic text-zinc-400">Unnamed lead</span>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-zinc-500">
          {lead.phone && (
            <span className="inline-flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {lead.phone}
            </span>
          )}
          {lead.email && (
            <span className="inline-flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {lead.email}
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset',
            sourceMeta.bg,
            sourceMeta.text,
            sourceMeta.ring
          )}
        >
          {sourceMeta.label}
        </span>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={lead.status} variant="lead" />
      </td>
      <td className="px-4 py-3">
        {fu.tone === 'none' ? (
          <span className="text-zinc-300">—</span>
        ) : (
          <div className="flex flex-col">
            <span
              className={cn(
                'inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
                followUpToneClasses(fu.tone)
              )}
            >
              {fu.label}
            </span>
            {fu.date && (
              <span className="mt-0.5 text-[11px] text-zinc-400">{fu.date}</span>
            )}
          </div>
        )}
      </td>
      <td className="px-4 py-3 max-w-[260px]">
        {lead.notes ? (
          <span className="line-clamp-1 text-zinc-600">{lead.notes}</span>
        ) : lead.follow_up_note ? (
          <span className="line-clamp-1 inline-flex items-center gap-1 text-zinc-500">
            <MessageSquare className="h-3 w-3 text-zinc-400" />
            {lead.follow_up_note}
          </span>
        ) : (
          <span className="text-zinc-300">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <div
          className="inline-flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {lead.phone && (
            <a
              href={`tel:${lead.phone}`}
              title={`Call ${lead.phone}`}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            >
              <Phone className="h-3.5 w-3.5" />
            </a>
          )}
          {lead.email && (
            <a
              href={`mailto:${lead.email}`}
              title={`Email ${lead.email}`}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            >
              <Mail className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </td>
    </tr>
  )
}
