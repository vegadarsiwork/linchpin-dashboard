'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Lock, Mail, MessageSquare, Phone, User as UserIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { NotificationChannel, NotificationPrefs, User } from '@/lib/types'

// ──────────────────────────────────────────────────────────────────
// Notification categories shown in the settings UI. Keep in sync
// with the DB default in migration 004.
// ──────────────────────────────────────────────────────────────────
type NotifCategoryKey =
  | 'new_lead'
  | 'reel_approval'
  | 'followup'
  | 'deliverable'
  | 'escalation'

const NOTIF_CATEGORIES: Array<{
  key: NotifCategoryKey
  label: string
  description: string
  channels: NotificationChannel[]
}> = [
  {
    key: 'new_lead',
    label: 'New leads captured',
    description: 'When a new lead lands in your CRM.',
    channels: ['email', 'whatsapp'],
  },
  {
    key: 'reel_approval',
    label: 'Reels ready for approval',
    description: 'When new content is awaiting your sign-off.',
    channels: ['email'],
  },
  {
    key: 'followup',
    label: 'Follow-up reminders',
    description: "When it's time to check in on a lead.",
    channels: ['email', 'whatsapp'],
  },
  {
    key: 'deliverable',
    label: 'Deliverables completed',
    description: "When something we've shipped is ready to review.",
    channels: ['email'],
  },
  {
    key: 'escalation',
    label: 'Zap escalations',
    description: 'When the WhatsApp AI agent needs human help.',
    channels: ['email', 'whatsapp'],
  },
]

const CHANNEL_LABELS: Record<NotificationChannel, string> = {
  in_app: 'In-app',
  email: 'Email',
  whatsapp: 'WhatsApp',
}

function defaultPrefs(): NotificationPrefs {
  const out: NotificationPrefs = {}
  for (const c of NOTIF_CATEGORIES) {
    out[c.key] = ['in_app', ...c.channels]
  }
  return out
}

// ──────────────────────────────────────────────────────────────────

interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4
  label: string
  color: string
}

function scorePassword(pw: string): PasswordStrength {
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++
  const safe = Math.min(4, score) as 0 | 1 | 2 | 3 | 4
  const map: Record<number, { label: string; color: string }> = {
    0: { label: 'Too weak', color: 'bg-red-500' },
    1: { label: 'Weak', color: 'bg-red-500' },
    2: { label: 'Okay', color: 'bg-amber-500' },
    3: { label: 'Strong', color: 'bg-emerald-500' },
    4: { label: 'Very strong', color: 'bg-emerald-600' },
  }
  return { score: safe, ...map[safe] }
}

// ──────────────────────────────────────────────────────────────────

export function SettingsClient({ user }: { user: User }) {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <ProfileSection user={user} onSaved={() => router.refresh()} />
      <PasswordSection />
      <NotificationsSection
        initial={user.notification_prefs ?? defaultPrefs()}
        onSaved={() => router.refresh()}
      />
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────

function SectionShell({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string
  description?: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <section className="app-panel rounded-lg">
      <div className="flex items-start gap-3 border-b border-zinc-100 px-6 py-5">
        <span className="app-icon-surface h-9 w-9 shrink-0">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <h2 className="app-heading text-base font-semibold">{title}</h2>
          {description && (
            <p className="app-subtle mt-0.5 text-sm">{description}</p>
          )}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </section>
  )
}

// ──────────────────────────────────────────────────────────────────

function ProfileSection({
  user,
  onSaved,
}: {
  user: User
  onSaved: () => void
}) {
  const [fullName, setFullName] = useState(user.full_name ?? '')
  const [phone, setPhone] = useState(user.phone ?? '')
  const [saving, setSaving] = useState(false)

  const dirty =
    fullName.trim() !== (user.full_name ?? '').trim() ||
    phone.trim() !== (user.phone ?? '').trim()

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!dirty) return
    setSaving(true)
    try {
      const res = await fetch('/api/settings/profile', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim() || null,
          phone: phone.trim() || null,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Save failed')
      }
      toast.success('Profile updated.')
      onSaved()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SectionShell
      title="Your account"
      description="Personal details we use to reach you."
      icon={UserIcon}
    >
      <form onSubmit={save} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Full name</Label>
            <Input
              id="full_name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user.email} readOnly disabled />
            <p className="text-[11px] text-zinc-500">
              Contact your account manager to change.
            </p>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="phone">
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-zinc-400" /> Phone
              </span>
            </Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              inputMode="tel"
            />
            <p className="text-[11px] text-zinc-500">
              Used for WhatsApp notifications. Include country code.
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving || !dirty}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving…
              </>
            ) : (
              'Save changes'
            )}
          </Button>
        </div>
      </form>
    </SectionShell>
  )
}

// ──────────────────────────────────────────────────────────────────

function PasswordSection() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)

  const strength = useMemo(() => scorePassword(next), [next])
  const matches = next.length > 0 && next === confirm
  const valid = current.length > 0 && next.length >= 8 && matches

  async function update(e: React.FormEvent) {
    e.preventDefault()
    if (!valid) return
    setBusy(true)
    try {
      const res = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: current,
          password: next,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Update failed')
      }

      toast.success('Password updated.')
      setCurrent('')
      setNext('')
      setConfirm('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <SectionShell
      title="Change password"
      description="Pick something at least 8 characters long."
      icon={Lock}
    >
      <form onSubmit={update} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="current">Current password</Label>
          <Input
            id="current"
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="next">New password</Label>
            <Input
              id="next"
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              autoComplete="new-password"
            />
            {next.length > 0 && (
              <div className="space-y-1">
                <div className="flex h-1.5 overflow-hidden rounded-full bg-zinc-100">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex-1 transition-colors',
                        i < strength.score
                          ? strength.color
                          : 'bg-transparent',
                        i > 0 && 'ml-0.5'
                      )}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-zinc-500">{strength.label}</p>
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirm new password</Label>
            <Input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
            {confirm.length > 0 && !matches && (
              <p className="text-[11px] text-red-600">
                Passwords don&apos;t match.
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={!valid || busy}>
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Updating…
              </>
            ) : (
              'Update password'
            )}
          </Button>
        </div>
      </form>
    </SectionShell>
  )
}

// ──────────────────────────────────────────────────────────────────

function NotificationsSection({
  initial,
  onSaved,
}: {
  initial: NotificationPrefs
  onSaved: () => void
}) {
  const [prefs, setPrefs] = useState<NotificationPrefs>(() =>
    mergeDefaults(initial)
  )
  const [saving, setSaving] = useState(false)

  function toggle(key: NotifCategoryKey, channel: NotificationChannel) {
    setPrefs((prev) => {
      const cur = new Set(prev[key] ?? [])
      if (cur.has(channel)) cur.delete(channel)
      else cur.add(channel)
      return { ...prev, [key]: Array.from(cur) }
    })
  }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/settings/notifications', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ notification_prefs: prefs }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Save failed')
      }
      toast.success('Notification preferences saved.')
      onSaved()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SectionShell
      title="Notifications"
      description="Choose how we reach you for each event."
      icon={MessageSquare}
    >
      <div className="space-y-4">
        {NOTIF_CATEGORIES.map((cat) => {
          const enabled = prefs[cat.key] ?? []
          return (
            <div
              key={cat.key}
              className="app-soft-panel rounded-lg p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="app-heading text-sm font-medium">
                    {cat.label}
                  </div>
                  <div className="app-subtle mt-0.5 text-[12px]">
                    {cat.description}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {cat.channels.map((ch) => {
                    const active = enabled.includes(ch)
                    return (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => toggle(cat.key, ch)}
                        className={cn(
                          'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors',
                          active
                            ? 'border-violet-600 bg-violet-600 text-white'
                            : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'
                        )}
                        aria-pressed={active}
                      >
                        {ch === 'email' ? (
                          <Mail className="h-3 w-3" />
                        ) : (
                          <MessageSquare className="h-3 w-3" />
                        )}
                        {CHANNEL_LABELS[ch]}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}

        <div className="flex justify-end">
          <Button type="button" onClick={save} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving…
              </>
            ) : (
              'Save preferences'
            )}
          </Button>
        </div>
      </div>
    </SectionShell>
  )
}

function mergeDefaults(prefs: NotificationPrefs): NotificationPrefs {
  const merged: NotificationPrefs = { ...defaultPrefs() }
  for (const [k, v] of Object.entries(prefs)) {
    if (Array.isArray(v)) merged[k] = v as NotificationChannel[]
  }
  return merged
}
