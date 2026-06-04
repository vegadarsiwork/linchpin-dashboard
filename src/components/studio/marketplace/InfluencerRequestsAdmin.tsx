'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type AdminRequest = {
  id: string
  org_id: string
  org_name: string | null
  client_name: string | null
  client_email: string | null
  influencer_name: string | null
  influencer_handle: string | null
  influencer_platform: string | null
  internal_rate_per_reel: number | null
  price_range_min_inr: number | null
  price_range_max_inr: number | null
  status: string
  request_source: string
  client_notes: string | null
  admin_notes: string | null
  created_at: string
  requested_influencer_id: string | null
  selected_influencer_id: string | null
}

const STATUS_OPTIONS = [
  'requested',
  'under_review',
  'confirmed',
  'unavailable',
  'script_ready',
  'in_production',
  'delivered',
]

function fmtInr(n: number | null) {
  return n == null ? '-' : `Rs ${n.toLocaleString('en-IN')}`
}

function statusClass(status: string) {
  if (status === 'confirmed' || status === 'delivered') return 'bg-emerald-100 text-emerald-800'
  if (status === 'unavailable') return 'bg-red-100 text-red-800'
  if (status === 'script_ready') return 'bg-cyan-100 text-cyan-800'
  return 'bg-violet-100 text-violet-800'
}

async function readJson(res: Response) {
  const text = await res.text()
  if (!text) return {}
  try {
    return JSON.parse(text) as Record<string, unknown>
  } catch {
    return { error: text.slice(0, 180) || `Request failed with ${res.status}` }
  }
}

export function InfluencerRequestsAdmin() {
  const [requests, setRequests] = useState<AdminRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)

  async function loadRequests() {
    setLoading(true)
    const res = await fetch('/api/admin/influencer-requests')
    const json = await readJson(res)
    if (res.ok) setRequests((json.requests as AdminRequest[]) ?? [])
    else toast.error(String(json.error ?? 'Failed to load requests'))
    setLoading(false)
  }

  useEffect(() => {
    loadRequests()
  }, [])

  async function updateStatus(id: string, status: string) {
    setSavingId(id)
    const res = await fetch('/api/admin/influencer-requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    const json = await readJson(res)
    setSavingId(null)
    if (!res.ok) {
      toast.error(String(json.error ?? 'Failed to update request'))
      return
    }
    toast.success('Request updated')
    await loadRequests()
  }

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-zinc-200 bg-white">
        <Loader2 className="h-5 w-5 animate-spin text-[#7C3AED]" />
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1040px] text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Creator</th>
              <th className="px-4 py-3">Pricing</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Notes</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-zinc-500">No creator requests yet.</td></tr>
            )}
            {requests.map((request) => (
              <tr key={request.id} className="border-b border-zinc-100 last:border-0">
                <td className="px-4 py-3">
                  <div className="font-medium text-zinc-900">{request.org_name ?? 'Client'}</div>
                  <div className="text-xs text-zinc-500">{request.client_email ?? request.client_name ?? '-'}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-zinc-900">{request.influencer_name ?? 'Not selected'}</div>
                  <div className="text-xs text-zinc-500">{request.influencer_handle ? `@${request.influencer_handle}` : request.influencer_platform ?? '-'}</div>
                </td>
                <td className="px-4 py-3 text-xs text-zinc-600">
                  <div>Public: {fmtInr(request.price_range_min_inr)} - {fmtInr(request.price_range_max_inr)}</div>
                  <div>Internal: {fmtInr(request.internal_rate_per_reel)}</div>
                </td>
                <td className="px-4 py-3 capitalize text-zinc-600">{request.request_source}</td>
                <td className="px-4 py-3">
                  <span className={cn('rounded-full px-2 py-1 text-xs font-semibold', statusClass(request.status))}>
                    {request.status.replaceAll('_', ' ')}
                  </span>
                </td>
                <td className="max-w-[260px] px-4 py-3 text-xs text-zinc-500">
                  <div className="line-clamp-2">{request.client_notes || request.admin_notes || '-'}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <select
                      value={request.status}
                      onChange={(e) => updateStatus(request.id, e.target.value)}
                      disabled={savingId === request.id}
                      className="h-8 rounded-md border border-zinc-200 bg-white px-2 text-xs"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>
                      ))}
                    </select>
                    <Link
                      href={`/admin/scripts/new?orgId=${request.org_id}&influencerId=${request.requested_influencer_id ?? request.selected_influencer_id ?? ''}&matchRequestId=${request.id}`}
                      className="rounded-md bg-[#7C3AED] px-3 py-2 text-xs font-semibold text-white hover:bg-[#6D28D9]"
                    >
                      Script
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
