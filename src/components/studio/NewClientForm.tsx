'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const PLANS = [
  {
    key: 'spark',
    label: 'Spark',
    desc: 'Starter — content + leads',
    features: ['Up to 8 reels/mo', 'Lead tracking', 'Basic reporting'],
  },
  {
    key: 'system',
    label: 'System',
    desc: 'Most popular — full ops stack',
    features: ['Unlimited reels', 'Lead + outreach', 'Zap WhatsApp AI', 'Weekly reports'],
  },
  {
    key: 'scale',
    label: 'Scale',
    desc: 'Growth — influencer + ads',
    features: ['Everything in System', 'Influencer campaigns', 'Paid ads mgmt', 'Dedicated AM'],
  },
]

const MODULES = [
  { key: 'content', label: 'Content', desc: 'Reels & video content' },
  { key: 'leads', label: 'Leads', desc: 'Lead tracking & follow-up' },
  { key: 'outreach', label: 'Outreach', desc: 'Email, LinkedIn, campaign tracking' },
  { key: 'zap', label: 'Zap', desc: 'WhatsApp AI agent' },
  { key: 'web', label: 'Web', desc: 'Website & landing pages' },
  { key: 'ads', label: 'Ads', desc: 'Paid advertising' },
  { key: 'influencer', label: 'Influencer', desc: 'Influencer campaigns' },
]

const BRAND_CATEGORIES = [
  'skincare',
  'fitness',
  'food & beverage',
  'edtech',
  'real estate',
  'healthcare',
  'fashion',
  'tech',
  'restaurant',
  'salon',
  'coaching',
  'other',
]

const TONES = ['Premium', 'Fun & Relatable', 'Educational', 'Raw & Real', 'Aspirational']

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function Section({
  title,
  desc,
  children,
}: {
  title: string
  desc?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6">
      <header className="mb-5 border-b border-zinc-100 pb-4">
        <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
        {desc && <p className="mt-0.5 text-sm text-zinc-500">{desc}</p>}
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

export function NewClientForm() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Section 1
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugDirty, setSlugDirty] = useState(false)
  const [plan, setPlan] = useState('system')
  const [billingCycleStart, setBillingCycleStart] = useState('')
  const [monthlyRate, setMonthlyRate] = useState('')

  // Section 2
  const [modules, setModules] = useState<string[]>(['content', 'leads'])
  const [zapOrgId, setZapOrgId] = useState('')

  // Section 3
  const [brandCategory, setBrandCategory] = useState('')
  const [brandDescription, setBrandDescription] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [brandTone, setBrandTone] = useState('Premium')

  // Section 4
  const [amName, setAmName] = useState('')
  const [amEmail, setAmEmail] = useState('')
  const [amPhone, setAmPhone] = useState('')
  const [amAvatar, setAmAvatar] = useState('')

  // Section 5
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')

  const effectiveSlug = useMemo(
    () => (slugDirty ? slug : slugify(name)),
    [slug, slugDirty, name]
  )

  function toggleModule(key: string) {
    setModules((prev) =>
      prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]
    )
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) return setError('Organisation name is required.')
    if (!effectiveSlug) return setError('Slug is required.')
    if (!contactName.trim()) return setError('Client contact name is required.')
    if (!contactEmail.trim()) return setError('Client contact email is required.')

    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          org: {
            name: name.trim(),
            slug: effectiveSlug,
            plan,
            status: 'active',
            active_modules: modules,
            zap_enabled: modules.includes('zap'),
            zap_org_id: modules.includes('zap') ? zapOrgId.trim() || null : null,
            web_enabled: modules.includes('web'),
            billing_cycle_start: billingCycleStart || null,
            account_manager_name: amName.trim() || null,
            account_manager_email: amEmail.trim() || null,
            account_manager_phone: amPhone.trim() || null,
            account_manager_avatar_url: amAvatar.trim() || null,
            brand_category: brandCategory || null,
            brand_description: brandDescription.trim() || null,
            target_audience: targetAudience.trim() || null,
            brand_tone: brandTone || null,
          },
          monthly_rate: monthlyRate ? Number(monthlyRate) : null,
          contact: {
            full_name: contactName.trim(),
            email: contactEmail.trim().toLowerCase(),
            phone: contactPhone.trim() || null,
          },
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || 'Failed to create client.')
      }
      toast.success(`Client created. Invite email sent to ${contactEmail}.`)
      router.push(`/admin/clients/${json.org_id}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setError(msg)
      toast.error(msg)
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Section title="Organisation" desc="Basic identity and billing setup.">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Skincare Co."
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={effectiveSlug}
              onChange={(e) => {
                setSlug(slugify(e.target.value))
                setSlugDirty(true)
              }}
              placeholder="acme-skincare"
            />
            <p className="text-[11px] text-zinc-500">URL-safe, lowercase, hyphens.</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Plan</Label>
          <div className="grid gap-3 md:grid-cols-3">
            {PLANS.map((p) => {
              const active = plan === p.key
              return (
                <label
                  key={p.key}
                  className={cn(
                    'flex cursor-pointer flex-col rounded-lg border p-4 transition-all',
                    active
                      ? 'border-[#7C3AED] bg-violet-50/50 ring-2 ring-violet-200'
                      : 'border-zinc-200 hover:border-zinc-300'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-900">{p.label}</span>
                    <input
                      type="radio"
                      name="plan"
                      value={p.key}
                      checked={active}
                      onChange={() => setPlan(p.key)}
                      className="h-4 w-4 accent-[#7C3AED]"
                    />
                  </div>
                  <span className="mt-0.5 text-[12px] text-zinc-500">{p.desc}</span>
                  <ul className="mt-2.5 space-y-1 text-[12px] text-zinc-600">
                    {p.features.map((f) => (
                      <li key={f} className="flex gap-1.5">
                        <span className="text-zinc-400">·</span> {f}
                      </li>
                    ))}
                  </ul>
                </label>
              )
            })}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="billing">Billing cycle start</Label>
            <Input
              id="billing"
              type="date"
              value={billingCycleStart}
              onChange={(e) => setBillingCycleStart(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rate">Monthly rate (₹)</Label>
            <Input
              id="rate"
              type="number"
              min={0}
              value={monthlyRate}
              onChange={(e) => setMonthlyRate(e.target.value)}
              placeholder="50000"
            />
          </div>
        </div>
      </Section>

      <Section title="Active Modules" desc="Toggle features the client can access.">
        <div className="grid gap-3 md:grid-cols-2">
          {MODULES.map((m) => {
            const active = modules.includes(m.key)
            return (
              <label
                key={m.key}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-all',
                  active
                    ? 'border-[#7C3AED] bg-violet-50/50'
                    : 'border-zinc-200 hover:border-zinc-300'
                )}
              >
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => toggleModule(m.key)}
                  className="mt-0.5 h-4 w-4 accent-[#7C3AED]"
                />
                <div>
                  <div className="text-sm font-medium text-zinc-900">{m.label}</div>
                  <div className="text-[12px] text-zinc-500">{m.desc}</div>
                </div>
              </label>
            )
          })}
        </div>
        {modules.includes('zap') && (
          <div className="space-y-1.5">
            <Label htmlFor="zapOrgId">Zap Org ID</Label>
            <Input
              id="zapOrgId"
              value={zapOrgId}
              onChange={(e) => setZapOrgId(e.target.value)}
              placeholder="zap_acme_xxxxx"
            />
            <p className="text-[11px] text-zinc-500">
              Identifier from the Zap WhatsApp AI service.
            </p>
          </div>
        )}
      </Section>

      <Section
        title="Brand Context"
        desc="Used by AI matching and script generation."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="cat">Brand category</Label>
            <select
              id="cat"
              value={brandCategory}
              onChange={(e) => setBrandCategory(e.target.value)}
              className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
            >
              <option value="">Select category…</option>
              {BRAND_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c[0].toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="desc">Brand description</Label>
          <textarea
            id="desc"
            rows={2}
            value={brandDescription}
            onChange={(e) => setBrandDescription(e.target.value)}
            placeholder="What does this business do?"
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="aud">Target audience</Label>
          <textarea
            id="aud"
            rows={2}
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            placeholder="Who is their ideal customer?"
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
          />
        </div>

        <div className="space-y-2">
          <Label>Brand tone</Label>
          <div className="flex flex-wrap gap-2">
            {TONES.map((t) => {
              const active = brandTone === t
              return (
                <label
                  key={t}
                  className={cn(
                    'inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors',
                    active
                      ? 'border-[#7C3AED] bg-violet-50 text-[#6D28D9]'
                      : 'border-zinc-200 text-zinc-700 hover:border-zinc-300'
                  )}
                >
                  <input
                    type="radio"
                    name="tone"
                    value={t}
                    checked={active}
                    onChange={() => setBrandTone(t)}
                    className="sr-only"
                  />
                  {t}
                </label>
              )
            })}
          </div>
        </div>
      </Section>

      <Section title="Account Manager" desc="The Linchpin lead on this account.">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="amName">Name</Label>
            <Input id="amName" value={amName} onChange={(e) => setAmName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="amEmail">Email</Label>
            <Input
              id="amEmail"
              type="email"
              value={amEmail}
              onChange={(e) => setAmEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="amPhone">Phone</Label>
            <Input
              id="amPhone"
              value={amPhone}
              onChange={(e) => setAmPhone(e.target.value)}
              placeholder="9999900000"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="amAvatar">Avatar URL</Label>
            <Input
              id="amAvatar"
              type="url"
              value={amAvatar}
              onChange={(e) => setAmAvatar(e.target.value)}
              placeholder="https://…"
            />
          </div>
        </div>
      </Section>

      <Section
        title="Client Contact"
        desc="Creates an app login account for the client contact."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="cName">Full name *</Label>
            <Input
              id="cName"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cEmail">Email *</Label>
            <Input
              id="cEmail"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cPhone">Phone</Label>
            <Input
              id="cPhone"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />
          </div>
        </div>
      </Section>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="sticky bottom-0 -mx-6 flex justify-end gap-3 border-t border-zinc-200 bg-white/90 px-6 py-4 backdrop-blur-sm">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Creating…
            </>
          ) : (
            'Create Client'
          )}
        </Button>
      </div>
    </form>
  )
}
