import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Film,
  Plus,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { createAdminClient } from '@/lib/db/client'
import { ClientsTable, type ClientRow } from '@/components/studio/ClientsTable'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface OrgRow {
  id: string
  name: string
  slug: string
  logo_url: string | null
  plan: string | null
  status: string | null
  active_modules: string[] | null
  account_manager_name: string | null
}

interface CreatorApplicationRow {
  id: string
  display_name: string | null
  name: string
  city: string | null
  approval_status: string
  profile_submitted_at: string | null
  created_at: string
  owner_email: string | null
}

interface CreatorRequestRow {
  id: string
  status: string
  brief: unknown
  created_at: string
  org_name: string | null
  influencer_name: string | null
}

function StatCard({
  label,
  value,
  href,
  icon: Icon,
}: {
  label: string
  value: number
  href: string
  icon: typeof Users
}) {
  return (
    <Link
      href={href}
      className="group rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-violet-50 text-[#7C3AED]">
          <Icon className="h-4 w-4" />
        </div>
        <ArrowRight className="h-4 w-4 text-zinc-300 transition-colors group-hover:text-zinc-600" />
      </div>
      <div className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900">
        {value}
      </div>
      <div className="mt-1 text-sm text-zinc-500">{label}</div>
    </Link>
  )
}

function formatDate(value: string | null) {
  if (!value) return 'Not submitted'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not submitted'
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function briefPreview(value: unknown) {
  if (!value) return null
  if (typeof value === 'string') return value
  if (typeof value !== 'object') return String(value)

  const brief = value as Record<string, unknown>
  const parts = [
    brief.brand_category,
    brief.goal,
    brief.target_audience,
    brief.format,
    brief.language,
  ]
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean)

  return parts.length > 0 ? parts.join(' - ') : 'Campaign brief submitted'
}

export default async function AllClientsPage() {
  const admin = createAdminClient()

  const [
    orgsRes,
    usersRes,
    metricsRes,
    creatorStatsRows,
    recentApplications,
    recentRequests,
  ] = await Promise.all([
    admin
      .from('organisations')
      .select(
        'id,name,slug,logo_url,plan,status,active_modules,account_manager_name'
      )
      .order('name', { ascending: true }),
    admin.from('users').select('org_id,last_seen_at').eq('role', 'client'),
    admin
      .from('metrics')
      .select('org_id,metric_value,metric_key,period')
      .eq('metric_key', 'leads_total')
      .eq('period', 'week'),
    query<{
      pending_profiles: number
      pending_reels: number
      open_requests: number
      public_creators: number
    }>(
      `select
        count(*) filter (where i.user_id is not null and i.approval_status = 'pending_review')::int as pending_profiles,
        (select count(*)::int from influencer_reels where approval_status = 'pending_review') as pending_reels,
        (select count(*)::int from influencer_match_requests where status in ('requested', 'under_review')) as open_requests,
        count(*) filter (where i.public_visible = true and i.approval_status = 'approved')::int as public_creators
       from influencers i`
    ),
    query<CreatorApplicationRow>(
      `select
         i.id,
         i.display_name,
         i.name,
         i.city,
         i.approval_status,
         i.profile_submitted_at::text as profile_submitted_at,
         i.created_at::text as created_at,
         u.email as owner_email
       from influencers i
       left join users u on u.id = i.user_id
       where i.user_id is not null
       order by
         case i.approval_status when 'pending_review' then 0 when 'draft' then 1 else 2 end,
         i.created_at desc
       limit 5`
    ),
    query<CreatorRequestRow>(
      `select
         imr.id,
         imr.status,
         imr.brief,
         imr.created_at::text as created_at,
         o.name as org_name,
         i.name as influencer_name
       from influencer_match_requests imr
       left join organisations o on o.id = imr.org_id
       left join influencers i on i.id = coalesce(imr.requested_influencer_id, imr.selected_influencer_id)
       order by
         case imr.status when 'requested' then 0 when 'under_review' then 1 when 'confirmed' then 2 else 3 end,
         imr.created_at desc
       limit 5`
    ),
  ])

  const orgs = (orgsRes.data ?? []) as OrgRow[]
  const usersByOrg = new Map<string, string | null>()
  for (const u of usersRes.data ?? []) {
    if (!u.org_id) continue
    const existing = usersByOrg.get(u.org_id)
    if (!existing || (u.last_seen_at && (!existing || u.last_seen_at > existing))) {
      usersByOrg.set(u.org_id, u.last_seen_at)
    }
  }
  const leadsByOrg = new Map<string, number>()
  for (const m of metricsRes.data ?? []) {
    if (m.org_id) leadsByOrg.set(m.org_id, Number(m.metric_value ?? 0))
  }

  const rows: ClientRow[] = orgs.map((o) => ({
    id: o.id,
    name: o.name,
    slug: o.slug,
    logo_url: o.logo_url,
    plan: o.plan,
    status: o.status,
    active_modules: o.active_modules ?? [],
    account_manager_name: o.account_manager_name,
    leads_this_week: leadsByOrg.get(o.id) ?? null,
    last_login_at: usersByOrg.get(o.id) ?? null,
  }))
  const creatorStats = creatorStatsRows[0] ?? {
    pending_profiles: 0,
    pending_reels: 0,
    open_requests: 0,
    public_creators: 0,
  }

  return (
    <div className="mx-auto max-w-[1280px] space-y-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Admin Command Center
          </h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            Review creator marketplace activity and manage client accounts.
          </p>
        </div>
        <Link
          href="/admin/clients/new"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#7C3AED] px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#6D28D9]"
        >
          <Plus className="h-4 w-4" /> New Client
        </Link>
      </div>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Creator profiles pending"
          value={creatorStats.pending_profiles}
          href="/admin/influencer-applications"
          icon={ShieldCheck}
        />
        <StatCard
          label="Trial reels pending"
          value={creatorStats.pending_reels}
          href="/admin/influencer-applications"
          icon={Film}
        />
        <StatCard
          label="Open creator requests"
          value={creatorStats.open_requests}
          href="/admin/influencer-requests"
          icon={ClipboardList}
        />
        <StatCard
          label="Live marketplace creators"
          value={creatorStats.public_creators}
          href="/admin/influencers"
          icon={Users}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="rounded-lg border border-zinc-200 bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">
                Creator Applications
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                Influencer-owned profiles waiting for Linchpin review.
              </p>
            </div>
            <Link
              href="/admin/influencer-applications"
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-zinc-100">
            {recentApplications.map((application) => (
              <div
                key={application.id}
                className="grid gap-3 px-4 py-3 md:grid-cols-[1fr_auto]"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-zinc-900">
                      {application.display_name || application.name}
                    </span>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                      {application.approval_status.replaceAll('_', ' ')}
                    </span>
                  </div>
                  <div className="mt-1 truncate text-sm text-zinc-500">
                    {application.city || 'No city'} · {application.owner_email || 'No email'}
                  </div>
                </div>
                <div className="text-xs text-zinc-500 md:text-right">
                  {formatDate(application.profile_submitted_at || application.created_at)}
                </div>
              </div>
            ))}
            {recentApplications.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-zinc-500">
                No creator applications yet.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">
                Creator Requests
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                Client requests that need operator follow-up.
              </p>
            </div>
            <Link
              href="/admin/influencer-requests"
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              View
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-zinc-100">
            {recentRequests.map((request) => (
              <div key={request.id} className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-zinc-900">
                    {request.org_name || 'Unknown client'}
                  </span>
                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-800">
                    {request.status.replaceAll('_', ' ')}
                  </span>
                </div>
                <div className="mt-1 text-sm text-zinc-500">
                  {request.influencer_name || 'No creator selected'}
                </div>
                {briefPreview(request.brief) && (
                  <p className="mt-2 line-clamp-2 text-xs text-zinc-500">
                    {briefPreview(request.brief)}
                  </p>
                )}
              </div>
            ))}
            {recentRequests.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-zinc-500">
                No creator requests yet.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Clients</h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              {rows.length} {rows.length === 1 ? 'client' : 'clients'} in the studio
            </p>
          </div>
          <CheckCircle2 className="h-4 w-4 text-zinc-300" />
        </div>
        <ClientsTable rows={rows} />
      </section>
    </div>
  )
}
