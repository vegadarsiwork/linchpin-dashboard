'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Search,
  Video,
  MessageCircle,
  Send,
  Globe,
  Users,
  Eye,
  Pencil,
  MoreHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ClientRow {
  id: string
  name: string
  slug: string
  logo_url: string | null
  plan: string | null
  status: string | null
  active_modules: string[]
  account_manager_name: string | null
  leads_this_week: number | null
  last_login_at: string | null
}

const MODULE_ICONS: Record<string, { icon: typeof Video; label: string }> = {
  content: { icon: Video, label: 'Content' },
  zap: { icon: MessageCircle, label: 'Zap' },
  outreach: { icon: Send, label: 'Outreach' },
  web: { icon: Globe, label: 'Web' },
  influencer: { icon: Users, label: 'Influencer' },
}

function planPill(plan: string | null) {
  switch ((plan || '').toLowerCase()) {
    case 'system':
      return 'bg-violet-100 text-[#6D28D9]'
    case 'scale':
      return 'bg-amber-100 text-amber-800'
    case 'spark':
      return 'bg-zinc-100 text-zinc-700'
    default:
      return 'bg-zinc-100 text-zinc-600'
  }
}

function statusPill(status: string | null) {
  switch ((status || '').toLowerCase()) {
    case 'active':
      return { cls: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' }
    case 'paused':
      return { cls: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' }
    case 'churned':
      return { cls: 'bg-red-100 text-red-700', dot: 'bg-red-500' }
    default:
      return { cls: 'bg-zinc-100 text-zinc-600', dot: 'bg-zinc-400' }
  }
}

function relTime(iso: string | null): string {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(iso).toLocaleDateString()
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export function ClientsTable({ rows }: { rows: ClientRow[] }) {
  const [q, setQ] = useState('')
  const [plan, setPlan] = useState<string>('all')
  const [status, setStatus] = useState<string>('all')

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase()
    return rows.filter((r) => {
      if (ql && !r.name.toLowerCase().includes(ql)) return false
      if (plan !== 'all' && (r.plan || '').toLowerCase() !== plan) return false
      if (status !== 'all' && (r.status || '').toLowerCase() !== status) return false
      return true
    })
  }, [rows, q, plan, status])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search clients…"
            className="h-10 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
          />
        </div>
        <select
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
        >
          <option value="all">All Plans</option>
          <option value="spark">Spark</option>
          <option value="system">System</option>
          <option value="scale">Scale</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="churned">Churned</option>
        </select>
        <span className="ml-auto text-xs text-zinc-500">
          {filtered.length} of {rows.length}
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50/60 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Account Manager</th>
              <th className="px-4 py-3">Modules</th>
              <th className="px-4 py-3 text-right">Leads (wk)</th>
              <th className="px-4 py-3">Last Login</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-zinc-500">
                  No clients match your filters.
                </td>
              </tr>
            )}
            {filtered.map((r) => {
              const sp = statusPill(r.status)
              return (
                <tr
                  key={r.id}
                  className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/60"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {r.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.logo_url}
                          alt={r.name}
                          className="h-8 w-8 rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-violet-100 text-xs font-semibold text-[#7C3AED]">
                          {initials(r.name)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/clients/${r.id}`}
                            className="truncate font-medium text-zinc-900 hover:underline"
                          >
                            {r.name}
                          </Link>
                          {r.plan && (
                            <span
                              className={cn(
                                'inline-flex h-5 items-center rounded-full px-2 text-[10px] font-semibold uppercase tracking-wide',
                                planPill(r.plan)
                              )}
                            >
                              {r.plan}
                            </span>
                          )}
                        </div>
                        <div className="truncate text-[11px] text-zinc-500">
                          {r.slug}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium',
                        sp.cls
                      )}
                    >
                      <span className={cn('h-1.5 w-1.5 rounded-full', sp.dot)} />
                      {(r.status || 'unknown').replace(/^\w/, (c) => c.toUpperCase())}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-700">
                    {r.account_manager_name || (
                      <span className="text-zinc-400">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {r.active_modules.length === 0 && (
                        <span className="text-[11px] text-zinc-400">none</span>
                      )}
                      {r.active_modules.map((m) => {
                        const meta = MODULE_ICONS[m]
                        if (!meta) return null
                        const Icon = meta.icon
                        return (
                          <span
                            key={m}
                            title={meta.label}
                            className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-zinc-100 text-zinc-600"
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                        )
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-zinc-900">
                    {r.leads_this_week ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{relTime(r.last_login_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/clients/${r.id}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/admin/clients/${r.id}?tab=settings`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                        title="More"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
