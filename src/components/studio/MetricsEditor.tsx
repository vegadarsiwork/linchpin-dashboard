'use client'

import { useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  metricsForModules,
  type MetricDef,
  type MetricPeriod,
} from '@/lib/admin/metricRegistry'
import type { Metric } from '@/lib/types'

interface RowState {
  value: string
  change: string
  period: MetricPeriod
  source: string
  updated_at: string | null
}

function rowKey(key: string): string {
  return key
}

export function MetricsEditor({
  orgId,
  activeModules,
  existing,
}: {
  orgId: string
  activeModules: string[]
  existing: Metric[]
}) {
  const defs = useMemo(() => metricsForModules(activeModules), [activeModules])
  const [saving, setSaving] = useState(false)

  const [state, setState] = useState<Record<string, RowState>>(() => {
    const init: Record<string, RowState> = {}
    for (const d of defs) {
      const found = existing.find((e) => e.metric_key === d.key)
      init[rowKey(d.key)] = {
        value: found?.metric_value != null ? String(found.metric_value) : '',
        change: found?.metric_change != null ? String(found.metric_change) : '',
        period: (found?.period as MetricPeriod) || d.defaultPeriod,
        source: found?.source || d.defaultSource || 'manual',
        updated_at: found?.updated_at ?? null,
      }
    }
    return init
  })

  function update(key: string, patch: Partial<RowState>) {
    setState((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }))
  }

  async function saveAll() {
    if (saving) return
    setSaving(true)
    const payload = defs
      .map((d) => {
        const r = state[rowKey(d.key)]
        if (!r || r.value === '') return null
        return {
          metric_key: d.key,
          metric_value: Number(r.value),
          metric_change: r.change === '' ? null : Number(r.change),
          period: r.period,
          source: r.source || null,
        }
      })
      .filter(Boolean)

    try {
      const res = await fetch('/api/admin/metrics', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ org_id: orgId, metrics: payload }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to save metrics.')
      toast.success(`Saved ${json.count} metrics.`)
      // mark updated_at locally
      const now = new Date().toISOString()
      setState((prev) => {
        const next = { ...prev }
        for (const m of payload) {
          if (!m) continue
          const r = next[rowKey(m.metric_key)]
          if (r) next[rowKey(m.metric_key)] = { ...r, updated_at: now }
        }
        return next
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  function relTime(iso: string | null): string {
    if (!iso) return 'never'
    const diff = Date.now() - new Date(iso).getTime()
    const m = Math.floor(diff / 60_000)
    if (m < 1) return 'just now'
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    const d = Math.floor(h / 24)
    return `${d}d ago`
  }

  if (defs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500">
        No metrics defined for this client&apos;s active modules.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50/60 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              <th className="px-4 py-3">Metric</th>
              <th className="px-4 py-3 w-32">Value</th>
              <th className="px-4 py-3 w-32">% Change</th>
              <th className="px-4 py-3 w-36">Period</th>
              <th className="px-4 py-3 w-32">Source</th>
              <th className="px-4 py-3 w-28">Updated</th>
            </tr>
          </thead>
          <tbody>
            {defs.map((d: MetricDef) => {
              const r = state[rowKey(d.key)]
              return (
                <tr key={d.key} className="border-b border-zinc-100 last:border-0">
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-zinc-900">{d.label}</div>
                    <div className="text-[11px] text-zinc-500">
                      {d.module} · <code className="font-mono">{d.key}</code>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <input
                      type="number"
                      step="any"
                      value={r.value}
                      onChange={(e) => update(d.key, { value: e.target.value })}
                      className="h-9 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-sm tabular-nums focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
                      placeholder="0"
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <input
                      type="number"
                      step="any"
                      value={r.change}
                      onChange={(e) => update(d.key, { change: e.target.value })}
                      className="h-9 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-sm tabular-nums focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
                      placeholder="±%"
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="inline-flex rounded-md border border-zinc-200 p-0.5">
                      {(['week', 'month'] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => update(d.key, { period: p })}
                          className={cn(
                            'rounded px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide transition-colors',
                            r.period === p
                              ? 'bg-zinc-900 text-white'
                              : 'text-zinc-600 hover:text-zinc-900'
                          )}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <input
                      value={r.source}
                      onChange={(e) => update(d.key, { source: e.target.value })}
                      className="h-9 w-full rounded-md border border-zinc-200 bg-white px-2.5 text-[12px] focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
                    />
                  </td>
                  <td className="px-4 py-2.5 text-[11px] text-zinc-500">
                    {relTime(r.updated_at)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <Button onClick={saveAll} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Saving…
            </>
          ) : (
            'Save All Metrics'
          )}
        </Button>
      </div>
    </div>
  )
}
