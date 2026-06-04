import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { createAdminClient } from '@/lib/db/client'
import { ClientDetailTabs } from '@/components/studio/ClientDetailTabs'
import { MetricsEditor } from '@/components/studio/MetricsEditor'
import { DeliverablesEditor } from '@/components/studio/DeliverablesEditor'
import { ClientSettingsForm } from '@/components/studio/ClientSettingsForm'
import type { Deliverable, Metric, Organisation } from '@/lib/types'

export const dynamic = 'force-dynamic'

interface OverviewProps {
  org: Organisation
  metrics: Metric[]
  contactEmail: string | null
  lastSeenAt: string | null
}

function OverviewTab({ org, metrics, contactEmail, lastSeenAt }: OverviewProps) {
  const summary = metrics.slice(0, 6)
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Org snapshot
        </h3>
        <dl className="mt-4 grid grid-cols-2 gap-y-3 text-sm">
          <dt className="text-zinc-500">Plan</dt>
          <dd className="font-medium text-zinc-900">{org.plan || '—'}</dd>
          <dt className="text-zinc-500">Status</dt>
          <dd className="font-medium text-zinc-900">{org.status || '—'}</dd>
          <dt className="text-zinc-500">Modules</dt>
          <dd className="font-medium text-zinc-900">
            {org.active_modules?.join(', ') || 'none'}
          </dd>
          <dt className="text-zinc-500">AM</dt>
          <dd className="font-medium text-zinc-900">
            {org.account_manager_name || 'Unassigned'}
          </dd>
          <dt className="text-zinc-500">Contact</dt>
          <dd className="font-medium text-zinc-900">{contactEmail || '—'}</dd>
          <dt className="text-zinc-500">Last login</dt>
          <dd className="font-medium text-zinc-900">
            {lastSeenAt ? new Date(lastSeenAt).toLocaleString() : 'Never'}
          </dd>
        </dl>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Recent metrics
        </h3>
        {summary.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">No metrics recorded yet.</p>
        ) : (
          <ul className="mt-4 space-y-2.5">
            {summary.map((m) => (
              <li key={m.id} className="flex items-center justify-between text-sm">
                <span className="text-zinc-700">
                  <code className="font-mono text-[12px] text-zinc-500">{m.metric_key}</code>{' '}
                  <span className="text-[11px] uppercase text-zinc-400">
                    {m.period}
                  </span>
                </span>
                <span className="font-medium tabular-nums text-zinc-900">
                  {m.metric_value ?? '—'}
                  {m.metric_change != null && (
                    <span
                      className={
                        m.metric_change >= 0
                          ? 'ml-2 text-[12px] font-medium text-emerald-600'
                          : 'ml-2 text-[12px] font-medium text-red-600'
                      }
                    >
                      {m.metric_change >= 0 ? '+' : ''}
                      {m.metric_change}%
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function PlaceholderTab({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center">
      <p className="text-sm text-zinc-500">{label} view coming soon.</p>
    </div>
  )
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ orgId: string }>
}) {
  const { orgId } = await params
  const admin = createAdminClient()

  const [orgRes, metricsRes, deliverablesRes, userRes] = await Promise.all([
    admin.from('organisations').select('*').eq('id', orgId).single<Organisation>(),
    admin.from('metrics').select('*').eq('org_id', orgId),
    admin
      .from('deliverables')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false }),
    admin
      .from('users')
      .select('email,last_seen_at')
      .eq('org_id', orgId)
      .eq('role', 'client')
      .limit(1)
      .maybeSingle<{ email: string; last_seen_at: string | null }>(),
  ])

  if (orgRes.error || !orgRes.data) notFound()
  const org = orgRes.data
  const metrics = (metricsRes.data ?? []) as Metric[]
  const deliverables = (deliverablesRes.data ?? []) as Deliverable[]
  const contactEmail = userRes.data?.email ?? null
  const lastSeenAt = userRes.data?.last_seen_at ?? null

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900"
        >
          <ChevronLeft className="h-4 w-4" /> All clients
        </Link>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              {org.name}
            </h1>
            <p className="mt-0.5 text-sm text-zinc-500">{org.slug}</p>
          </div>
        </div>
      </div>

      <ClientDetailTabs
        tabs={[
          {
            key: 'overview',
            label: 'Overview',
            content: (
              <OverviewTab
                org={org}
                metrics={metrics}
                contactEmail={contactEmail}
                lastSeenAt={lastSeenAt}
              />
            ),
          },
          {
            key: 'metrics',
            label: 'Metrics',
            content: (
              <MetricsEditor
                orgId={org.id}
                activeModules={org.active_modules || []}
                existing={metrics}
              />
            ),
          },
          { key: 'reels', label: 'Reels', content: <PlaceholderTab label="Reels" /> },
          { key: 'leads', label: 'Leads', content: <PlaceholderTab label="Leads" /> },
          {
            key: 'campaigns',
            label: 'Campaigns',
            content: <PlaceholderTab label="Campaigns" />,
          },
          {
            key: 'deliverables',
            label: 'Deliverables',
            content: <DeliverablesEditor orgId={org.id} initial={deliverables} />,
          },
          {
            key: 'settings',
            label: 'Settings',
            content: <ClientSettingsForm org={org} />,
          },
        ]}
      />
    </div>
  )
}
