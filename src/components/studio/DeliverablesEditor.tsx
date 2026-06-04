'use client'

import { useState } from 'react'
import { Loader2, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { Deliverable } from '@/lib/types'

const STATUSES = ['pending', 'in_progress', 'review', 'delivered', 'cancelled']
const MODULES = ['content', 'leads', 'outreach', 'zap', 'web', 'ads', 'influencer']

function statusPill(status: string) {
  switch (status) {
    case 'delivered':
      return 'bg-emerald-100 text-emerald-700'
    case 'in_progress':
      return 'bg-violet-100 text-[#6D28D9]'
    case 'review':
      return 'bg-amber-100 text-amber-800'
    case 'cancelled':
      return 'bg-zinc-200 text-zinc-600'
    default:
      return 'bg-zinc-100 text-zinc-700'
  }
}

export function DeliverablesEditor({
  orgId,
  initial,
}: {
  orgId: string
  initial: Deliverable[]
}) {
  const [items, setItems] = useState<Deliverable[]>(initial)
  const [paneOpen, setPaneOpen] = useState(false)

  async function patchStatus(id: string, status: string) {
    const prev = items
    setItems((cur) => cur.map((d) => (d.id === id ? { ...d, status } : d)))
    try {
      const res = await fetch('/api/admin/deliverables', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Update failed')
      toast.success('Status updated.')
    } catch (e) {
      setItems(prev)
      toast.error(e instanceof Error ? e.message : 'Update failed')
    }
  }

  async function create(payload: {
    title: string
    description: string
    module: string
    due_date: string
    status: string
  }) {
    const res = await fetch('/api/admin/deliverables', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ org_id: orgId, ...payload }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Create failed')
    setItems((cur) => [json.deliverable as Deliverable, ...cur])
    toast.success('Deliverable added.')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">{items.length} deliverables</p>
        <Button onClick={() => setPaneOpen(true)}>
          <Plus className="h-4 w-4" /> Add Deliverable
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50/60 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Module</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3 w-44">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-sm text-zinc-500">
                  No deliverables yet.
                </td>
              </tr>
            )}
            {items.map((d) => (
              <tr key={d.id} className="border-b border-zinc-100 last:border-0">
                <td className="px-4 py-3">
                  <div className="font-medium text-zinc-900">{d.title}</div>
                  {d.description && (
                    <div className="line-clamp-1 text-[11px] text-zinc-500">
                      {d.description}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-zinc-700">{d.module || '—'}</td>
                <td className="px-4 py-3 text-zinc-700">
                  {d.due_date ? new Date(d.due_date).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={d.status}
                    onChange={(e) => patchStatus(d.id, e.target.value)}
                    className={cn(
                      'h-8 rounded-md border-0 px-2 text-[12px] font-medium focus:outline-none focus:ring-2 focus:ring-violet-200',
                      statusPill(d.status)
                    )}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {paneOpen && (
        <AddDeliverablePane
          onClose={() => setPaneOpen(false)}
          onCreate={async (p) => {
            await create(p)
            setPaneOpen(false)
          }}
        />
      )}
    </div>
  )
}

function AddDeliverablePane({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (p: {
    title: string
    description: string
    module: string
    due_date: string
    status: string
  }) => Promise<void>
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [module, setModule] = useState('content')
  const [dueDate, setDueDate] = useState('')
  const [status, setStatus] = useState('pending')
  const [submitting, setSubmitting] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitting(true)
    try {
      await onCreate({
        title: title.trim(),
        description: description.trim(),
        module,
        due_date: dueDate,
        status,
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Create failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-zinc-200 bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <h3 className="text-base font-semibold text-zinc-900">Add Deliverable</h3>
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <form onSubmit={submit} className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <div className="space-y-1.5">
            <Label htmlFor="dt">Title *</Label>
            <Input id="dt" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dd">Description</Label>
            <textarea
              id="dd"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="dm">Module</Label>
              <select
                id="dm"
                value={module}
                onChange={(e) => setModule(e.target.value)}
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
              >
                {MODULES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ds">Status</Label>
              <select
                id="ds"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ddate">Due date</Label>
            <Input
              id="ddate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </form>
        <footer className="flex justify-end gap-2 border-t border-zinc-200 px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving…
              </>
            ) : (
              'Add'
            )}
          </Button>
        </footer>
      </aside>
    </div>
  )
}
