import { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowUpRight, ShieldCheck } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/db/client'
import { OrgProvider } from '@/lib/context/OrgContext'
import { Sidebar } from '@/components/studio/Sidebar'
import { Topbar } from '@/components/studio/Topbar'
import {
  MetricCardsRow,
  MetricCardsSkeleton,
} from '@/components/studio/dashboard/MetricCardsRow'
import { ZapEscalationSection } from '@/components/studio/dashboard/ZapEscalationSection'
import { PendingReelsSection } from '@/components/studio/dashboard/PendingReelsSection'
import { FollowUpRemindersSection } from '@/components/studio/dashboard/FollowUpRemindersSection'
import {
  ActivityFeedSection,
  ActivityFeedSkeleton,
} from '@/components/studio/dashboard/ActivityFeedSection'
import {
  DeliverablesSection,
  DeliverablesSkeleton,
} from '@/components/studio/dashboard/DeliverablesSection'
import { CampaignStripSection } from '@/components/studio/dashboard/CampaignStripSection'
import {
  ProductionSummaryCards,
  ProductionSummaryCardsSkeleton,
} from '@/components/studio/dashboard/ProductionSummaryCards'
import type { Notification } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function CommandCenterPage() {
  const me = await getCurrentUser()
  if (!me) redirect('/dashboard/login')

  // Superadmin without an org context — point at admin
  if (me.user.role === 'superadmin' && !me.org) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="app-panel rounded-lg p-8 text-center">
          <ShieldCheck className="app-accent mx-auto h-10 w-10" />
          <h1 className="app-heading mt-3 text-xl font-semibold">
            Superadmin view
          </h1>
          <p className="app-subtle mt-1 text-sm">
            The Command Center is the client&apos;s home. Head to admin to manage
            organisations.
          </p>
          <Link
            href="/admin"
            className="mt-5 inline-flex items-center rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
          >
            Open admin
          </Link>
        </div>
      </div>
    )
  }

  if (!me.org) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="app-heading text-xl font-semibold">
          Account not yet provisioned
        </h1>
        <p className="app-subtle mt-2 text-sm">
          Your account isn&apos;t linked to an organisation yet. Contact your
          account manager.
        </p>
      </div>
    )
  }

  const orgId = me.org.id
  const activeModules = me.org.active_modules ?? []
  const firstName = me.user.full_name?.split(' ')[0] ?? 'there'
  const supabase = createAdminClient()

  const [reelsRes, zapRes, notifsRes, unreadRes] = await Promise.all([
    supabase
      .from('content_items')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('status', 'pending_approval'),
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('type', 'escalation')
      .eq('is_read', false),
    supabase
      .from('notifications')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('is_read', false),
  ])

  const notifications = (notifsRes.data ?? []) as Notification[]

  return (
    <OrgProvider value={{ user: me.user, org: me.org }}>
      <div className="app-shell min-h-screen">
        <Sidebar
          user={me.user}
          org={me.org}
          zapBadge={zapRes.count ?? 0}
          reelsBadge={reelsRes.count ?? 0}
        />
        <div className="md:pl-[264px]">
          <Topbar
            user={me.user}
            org={me.org}
            initialNotifications={notifications}
            initialUnreadCount={unreadRes.count ?? 0}
          />
          <main className="px-4 py-5 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl space-y-6">
              <section className="app-panel overflow-hidden rounded-lg p-4 sm:p-5">
                <div className="dashboard-briefing-row gap-4">
                  <div className="max-w-2xl">
                    <div className="app-subtle text-xs font-medium uppercase tracking-wide">
                      Morning briefing
                    </div>
                    <h1 className="app-heading mt-1.5 text-2xl font-semibold tracking-tight">
                      Hi {firstName}
                    </h1>
                    <p className="app-subtle mt-1.5 max-w-3xl text-sm leading-6">
                      {me.org.name} at a glance: what changed, what needs attention,
                      and what your Studio team is moving next.
                    </p>
                  </div>

                  <div className="grid w-full grid-cols-2 gap-3 text-sm sm:w-auto sm:min-w-[280px]">
                    <div className="app-soft-panel rounded-lg p-3">
                      <div className="app-subtle text-[11px] font-medium uppercase tracking-wide">
                        Active modules
                      </div>
                      <div className="app-heading mt-1 text-2xl font-semibold">
                        {activeModules.length}
                      </div>
                    </div>
                    <div className="app-soft-panel rounded-lg p-3">
                      <div className="app-subtle text-[11px] font-medium uppercase tracking-wide">
                        Plan
                      </div>
                      <div className="app-heading mt-1 flex items-center gap-1.5 text-2xl font-semibold capitalize">
                        {me.org.plan ?? 'Free'}
                        <ArrowUpRight className="app-accent h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <Suspense fallback={<ProductionSummaryCardsSkeleton />}>
                <ProductionSummaryCards orgId={orgId} />
              </Suspense>

              <Suspense fallback={<MetricCardsSkeleton count={4} />}>
                <MetricCardsRow orgId={orgId} activeModules={activeModules} />
              </Suspense>

              {me.org.zap_enabled && (
                <Suspense fallback={null}>
                  <ZapEscalationSection orgId={orgId} />
                </Suspense>
              )}

              <Suspense fallback={null}>
                <PendingReelsSection orgId={orgId} />
              </Suspense>

              <Suspense fallback={null}>
                <FollowUpRemindersSection orgId={orgId} />
              </Suspense>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                <div className="lg:col-span-3">
                  <Suspense fallback={<ActivityFeedSkeleton />}>
                    <ActivityFeedSection orgId={orgId} />
                  </Suspense>
                </div>
                <div className="lg:col-span-2">
                  <Suspense fallback={<DeliverablesSkeleton />}>
                    <DeliverablesSection orgId={orgId} />
                  </Suspense>
                </div>
              </div>

              <Suspense fallback={null}>
                <CampaignStripSection orgId={orgId} />
              </Suspense>
            </div>
          </main>
        </div>
      </div>
    </OrgProvider>
  )
}
