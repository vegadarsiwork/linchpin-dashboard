'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { Organisation } from '@/lib/types'

const PLANS = ['spark', 'system', 'scale']
const MODULES = ['content', 'leads', 'outreach', 'zap', 'web', 'ads', 'influencer']
const TONES = ['Premium', 'Fun & Relatable', 'Educational', 'Raw & Real', 'Aspirational']

export function ClientSettingsForm({ org }: { org: Organisation }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [name, setName] = useState(org.name)
  const [plan, setPlan] = useState(org.plan || 'system')
  const [modules, setModules] = useState<string[]>(org.active_modules || [])
  const [zapOrgId, setZapOrgId] = useState(org.zap_org_id || '')
  const [amName, setAmName] = useState(org.account_manager_name || '')
  const [amEmail, setAmEmail] = useState(org.account_manager_email || '')
  const [amPhone, setAmPhone] = useState(org.account_manager_phone || '')
  const [amAvatar, setAmAvatar] = useState(org.account_manager_avatar_url || '')
  const [brandCategory, setBrandCategory] = useState(org.brand_category || '')
  const [brandDescription, setBrandDescription] = useState(org.brand_description || '')
  const [targetAudience, setTargetAudience] = useState(org.target_audience || '')
  const [brandTone, setBrandTone] = useState(org.brand_tone || 'Premium')

  function toggleModule(key: string) {
    setModules((prev) =>
      prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]
    )
  }

  async function patch(payload: Record<string, unknown>) {
    const res = await fetch(`/api/admin/clients/${org.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error((await res.json()).error || 'Update failed')
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await patch({
        name: name.trim(),
        plan,
        active_modules: modules,
        zap_enabled: modules.includes('zap'),
        zap_org_id: modules.includes('zap') ? zapOrgId.trim() || null : null,
        web_enabled: modules.includes('web'),
        account_manager_name: amName.trim() || null,
        account_manager_email: amEmail.trim() || null,
        account_manager_phone: amPhone.trim() || null,
        account_manager_avatar_url: amAvatar.trim() || null,
        brand_category: brandCategory || null,
        brand_description: brandDescription.trim() || null,
        target_audience: targetAudience.trim() || null,
        brand_tone: brandTone || null,
      })
      toast.success('Settings saved.')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function deactivate() {
    if (!confirm('Pause this client? They will lose dashboard access until reactivated.')) return
    try {
      await patch({ status: 'paused' })
      toast.success('Client paused.')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    }
  }

  async function destroy() {
    const confirmText = prompt(
      `This permanently deletes "${org.name}" and all associated data.\nType the slug (${org.slug}) to confirm:`
    )
    if (confirmText !== org.slug) {
      if (confirmText !== null) toast.error('Slug did not match.')
      return
    }
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/clients/${org.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error || 'Delete failed')
      toast.success('Client deleted.')
      router.replace('/admin')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed')
      setDeleting(false)
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <section className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
        <h3 className="text-base font-semibold text-zinc-900">Organisation</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="sName">Name</Label>
            <Input id="sName" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sPlan">Plan</Label>
            <select
              id="sPlan"
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm"
            >
              {PLANS.map((p) => (
                <option key={p} value={p}>
                  {p[0].toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
        <h3 className="text-base font-semibold text-zinc-900">Modules</h3>
        <div className="grid gap-2 md:grid-cols-3">
          {MODULES.map((m) => {
            const active = modules.includes(m)
            return (
              <label
                key={m}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors',
                  active
                    ? 'border-[#7C3AED] bg-violet-50/50 text-zinc-900'
                    : 'border-zinc-200 text-zinc-700'
                )}
              >
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => toggleModule(m)}
                  className="h-4 w-4 accent-[#7C3AED]"
                />
                {m}
              </label>
            )
          })}
        </div>
        {modules.includes('zap') && (
          <div className="space-y-1.5">
            <Label htmlFor="sZap">Zap Org ID</Label>
            <Input id="sZap" value={zapOrgId} onChange={(e) => setZapOrgId(e.target.value)} />
          </div>
        )}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
        <h3 className="text-base font-semibold text-zinc-900">Account Manager</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={amName} onChange={(e) => setAmName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" value={amEmail} onChange={(e) => setAmEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input value={amPhone} onChange={(e) => setAmPhone(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Avatar URL</Label>
            <Input value={amAvatar} onChange={(e) => setAmAvatar(e.target.value)} />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
        <h3 className="text-base font-semibold text-zinc-900">Brand Context</h3>
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Input value={brandCategory} onChange={(e) => setBrandCategory(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <textarea
            rows={2}
            value={brandDescription}
            onChange={(e) => setBrandDescription(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Target audience</Label>
          <textarea
            rows={2}
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label>Tone</Label>
          <div className="flex flex-wrap gap-2">
            {TONES.map((t) => {
              const active = brandTone === t
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setBrandTone(t)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-sm transition-colors',
                    active
                      ? 'border-[#7C3AED] bg-violet-50 text-[#6D28D9]'
                      : 'border-zinc-200 text-zinc-700 hover:border-zinc-300'
                  )}
                >
                  {t}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Saving…
            </>
          ) : (
            'Save Settings'
          )}
        </Button>
      </div>

      <section className="rounded-xl border border-red-200 bg-red-50/30 p-6 space-y-3">
        <div className="flex items-center gap-2 text-red-700">
          <AlertTriangle className="h-4 w-4" />
          <h3 className="text-base font-semibold">Danger zone</h3>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-white px-4 py-3">
          <div>
            <div className="text-sm font-medium text-zinc-900">Pause client</div>
            <div className="text-[12px] text-zinc-500">
              Sets status to <code>paused</code>. Removes dashboard access.
            </div>
          </div>
          <Button type="button" variant="outline" onClick={deactivate}>
            Deactivate
          </Button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-white px-4 py-3">
          <div>
            <div className="text-sm font-medium text-zinc-900">Delete client</div>
            <div className="text-[12px] text-zinc-500">
              Permanently removes the org and all data. Cannot be undone.
            </div>
          </div>
          <Button
            type="button"
            variant="destructive"
            onClick={destroy}
            disabled={deleting}
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
          </Button>
        </div>
      </section>
    </form>
  )
}
