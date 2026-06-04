'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import { X, Mail, Phone, User as UserIcon, Clock, Trash2, Check } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Lead } from '@/lib/types'
import {
  LEAD_STATUSES,
  type LeadStatus,
  getSourceMeta,
  formatFollowUpDate,
  toDatetimeLocalValue,
} from './leadConstants'

export type LeadDrawerProps = {
  lead: Lead | null
  open: boolean
  onClose: () => void
  onUpdate: (lead: Lead) => void
  onDelete: (id: string) => void
}

type SaveState = 'idle' | 'saving' | 'saved'

async function patchLead(
  id: string,
  patch: Partial<Lead> & Record<string, unknown>
): Promise<Lead> {
  const res = await fetch(`/api/leads/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
  if (!res.ok) {
    const j = await res.json().catch(() => ({}))
    throw new Error(j.error ?? 'Failed to update')
  }
  const j = (await res.json()) as { data: Lead }
  return j.data
}

export function LeadDrawer({
  lead,
  open,
  onClose,
  onUpdate,
  onDelete,
}: LeadDrawerProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [followUpAt, setFollowUpAt] = useState('')
  const [followUpNote, setFollowUpNote] = useState('')

  const [notesSaveState, setNotesSaveState] = useState<SaveState>('idle')
  const [reminderSaving, setReminderSaving] = useState(false)
  const [statusSaving, setStatusSaving] = useState<LeadStatus | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Keep input state in sync when the lead changes
  useEffect(() => {
    if (!lead) return
    setName(lead.name ?? '')
    setPhone(lead.phone ?? '')
    setEmail(lead.email ?? '')
    setNotes(lead.notes ?? '')
    setFollowUpAt(toDatetimeLocalValue(lead.follow_up_at))
    setFollowUpNote(lead.follow_up_note ?? '')
    setNotesSaveState('idle')
  }, [lead?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const onEsc = useCallback(
    (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )
  useEffect(() => {
    if (!open) return
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [open, onEsc])

  if (!lead) return null

  const sourceMeta = getSourceMeta(lead.source)

  async function commitField(
    field: 'name' | 'phone' | 'email',
    value: string
  ) {
    if (!lead) return
    const trimmed = value.trim()
    const current = (lead[field] ?? '') as string
    if (trimmed === current) return
    try {
      const updated = await patchLead(lead.id, {
        [field]: trimmed.length === 0 ? null : trimmed,
      })
      onUpdate(updated)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save')
    }
  }

  async function commitNotes() {
    if (!lead) return
    const value = notes
    if ((lead.notes ?? '') === value) return
    setNotesSaveState('saving')
    try {
      const updated = await patchLead(lead.id, {
        notes: value.length === 0 ? null : value,
      })
      onUpdate(updated)
      setNotesSaveState('saved')
      setTimeout(() => setNotesSaveState('idle'), 1500)
    } catch (err) {
      setNotesSaveState('idle')
      toast.error(err instanceof Error ? err.message : 'Could not save notes')
    }
  }

  async function changeStatus(next: LeadStatus) {
    if (!lead || lead.status === next) return
    setStatusSaving(next)
    try {
      const updated = await patchLead(lead.id, { status: next })
      onUpdate(updated)
      toast.success(`Status set to ${next}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not change status')
    } finally {
      setStatusSaving(null)
    }
  }

  async function saveReminder() {
    if (!lead) return
    if (!followUpAt) {
      toast.error('Pick a date and time first')
      return
    }
    setReminderSaving(true)
    try {
      const iso = new Date(followUpAt).toISOString()
      const updated = await patchLead(lead.id, {
        follow_up_at: iso,
        follow_up_note: followUpNote.trim() || null,
      })
      onUpdate(updated)
      toast.success('Reminder set')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save reminder')
    } finally {
      setReminderSaving(false)
    }
  }

  async function clearReminder() {
    if (!lead) return
    setReminderSaving(true)
    try {
      const updated = await patchLead(lead.id, {
        follow_up_at: null,
        follow_up_note: null,
      })
      onUpdate(updated)
      setFollowUpAt('')
      setFollowUpNote('')
      toast.success('Reminder cleared')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not clear reminder')
    } finally {
      setReminderSaving(false)
    }
  }

  async function deleteLead() {
    if (!lead) return
    if (
      !window.confirm(
        'Delete this lead permanently? This cannot be undone. (To archive instead, mark it as Lost.)'
      )
    ) {
      return
    }
    setDeleting(true)
    try {
      const res = await fetch(`/api/leads/${lead.id}?hard=1`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Delete failed')
      onDelete(lead.id)
      onClose()
      toast.success('Lead deleted')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete')
    } finally {
      setDeleting(false)
    }
  }

  function onEnter(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      ;(e.target as HTMLInputElement).blur()
    }
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 transition',
        open ? 'pointer-events-auto' : 'pointer-events-none'
      )}
      aria-hidden={!open}
    >
      {/* Overlay */}
      <button
        aria-label="Close"
        onClick={onClose}
        className={cn(
          'absolute inset-0 bg-zinc-900/40 backdrop-blur-sm transition-opacity',
          open ? 'opacity-100' : 'opacity-0'
        )}
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-label="Lead details"
        className={cn(
          'absolute right-0 top-0 flex h-full w-full max-w-[480px] flex-col border-l border-zinc-200 bg-white shadow-2xl transition-transform duration-200',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <span
              title="Lead source cannot be changed"
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset',
                sourceMeta.bg,
                sourceMeta.text,
                sourceMeta.ring
              )}
            >
              {sourceMeta.label}
            </span>
            <span className="text-xs text-zinc-400">
              Added {new Date(lead.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </span>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          {/* Name */}
          <InlineField
            icon={<UserIcon className="h-4 w-4 text-zinc-400" />}
            label="Name"
            value={name}
            placeholder="Add a name"
            onChange={setName}
            onCommit={(v) => commitField('name', v)}
            onEnter={onEnter}
          />

          {/* Phone */}
          <InlineField
            icon={<Phone className="h-4 w-4 text-zinc-400" />}
            label="Phone"
            value={phone}
            placeholder="Add a phone number"
            onChange={setPhone}
            onCommit={(v) => commitField('phone', v)}
            onEnter={onEnter}
            type="tel"
          />

          {/* Email */}
          <InlineField
            icon={<Mail className="h-4 w-4 text-zinc-400" />}
            label="Email"
            value={email}
            placeholder="Add an email"
            onChange={setEmail}
            onCommit={(v) => commitField('email', v)}
            onEnter={onEnter}
            type="email"
          />

          {/* Status */}
          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              Status
            </div>
            <div className="grid grid-cols-5 gap-1 rounded-lg bg-zinc-100 p-1">
              {LEAD_STATUSES.map((s) => {
                const active = lead.status === s.key
                const saving = statusSaving === s.key
                return (
                  <button
                    key={s.key}
                    onClick={() => changeStatus(s.key)}
                    disabled={statusSaving !== null}
                    className={cn(
                      'h-8 rounded-md text-xs font-medium transition-colors disabled:opacity-60',
                      active
                        ? 'bg-white text-zinc-900 shadow-sm'
                        : 'text-zinc-600 hover:text-zinc-900'
                    )}
                  >
                    {saving ? '…' : s.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                Notes
              </div>
              {notesSaveState === 'saving' && (
                <span className="text-[11px] text-zinc-400">Saving…</span>
              )}
              {notesSaveState === 'saved' && (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600">
                  <Check className="h-3 w-3" /> Saved
                </span>
              )}
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={commitNotes}
              placeholder="Anything worth remembering…"
              rows={5}
              className="app-input w-full rounded-md px-3 py-2 text-sm"
            />
          </div>

          {/* Follow-up reminder */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="mb-3 flex items-center gap-2 text-amber-900">
              <Clock className="h-4 w-4" />
              <p className="text-sm font-semibold">Follow-up reminder</p>
            </div>

            {lead.follow_up_at && (
              <div className="mb-3 rounded-md bg-white px-3 py-2 text-sm text-zinc-700 ring-1 ring-amber-200">
                <span className="font-medium">
                  Remind me on {formatFollowUpDate(lead.follow_up_at)}
                </span>
                {lead.follow_up_note && (
                  <>: <span className="text-zinc-600">{lead.follow_up_note}</span></>
                )}
              </div>
            )}

            <div className="space-y-2">
              <input
                type="datetime-local"
                value={followUpAt}
                onChange={(e) => setFollowUpAt(e.target.value)}
                className="h-10 w-full rounded-md border border-amber-200 bg-white px-3 text-sm text-zinc-900 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              />
              <input
                type="text"
                value={followUpNote}
                onChange={(e) => setFollowUpNote(e.target.value)}
                placeholder="What do you need to do?"
                className="h-10 w-full rounded-md border border-amber-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              />
              <div className="flex gap-2">
                <button
                  onClick={saveReminder}
                  disabled={reminderSaving}
                  className="inline-flex h-9 items-center rounded-md bg-amber-500 px-3 text-sm font-medium text-white shadow-sm hover:bg-amber-600 disabled:opacity-60"
                >
                  {reminderSaving ? 'Saving…' : 'Set Reminder'}
                </button>
                {lead.follow_up_at && (
                  <button
                    onClick={clearReminder}
                    disabled={reminderSaving}
                    className="inline-flex h-9 items-center rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-200 px-5 py-3">
          <button
            onClick={deleteLead}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-60"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {deleting ? 'Deleting…' : 'Delete lead'}
          </button>
        </div>
      </aside>
    </div>
  )
}

function InlineField({
  icon,
  label,
  value,
  placeholder,
  onChange,
  onCommit,
  onEnter,
  type = 'text',
}: {
  icon: React.ReactNode
  label: string
  value: string
  placeholder: string
  onChange: (v: string) => void
  onCommit: (v: string) => void | Promise<void>
  onEnter: (e: KeyboardEvent<HTMLInputElement>) => void
  type?: 'text' | 'tel' | 'email'
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div>
      <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
        {icon}
        <span>{label}</span>
      </div>
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onCommit(e.target.value)}
        onKeyDown={onEnter}
        placeholder={placeholder}
        className="app-input h-10 w-full rounded-md border-transparent bg-transparent px-2 text-sm transition-colors hover:border-zinc-200 hover:bg-zinc-50 focus:bg-white"
      />
    </div>
  )
}
