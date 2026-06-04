import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/db/client'
import { OrgProvider } from '@/lib/context/OrgContext'
import { PageHeader } from '@/components/studio'
import { Sidebar } from '@/components/studio/Sidebar'
import { Topbar } from '@/components/studio/Topbar'
import { ReelsGrid } from '@/components/studio/reels/ReelsGrid'
import type { ContentItem, Notification } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function ReelsPage() {
  const me = await getCurrentUser()
  if (!me) redirect('/dashboard/login')
  if (!me.org) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-xl font-semibold text-zinc-900">
          Account not yet provisioned
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Your account isn&apos;t linked to an organisation yet.
        </p>
      </div>
    )
  }

  const supabase = createAdminClient()
  const orgId = me.org.id
  const [itemsRes, zapRes, notifsRes, unreadRes] = await Promise.all([
    supabase
      .from('content_items')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false }),
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

  const items = (itemsRes.data ?? []) as ContentItem[]
  const pendingCount = items.filter((i) => i.status === 'pending_approval').length
  const notifications = (notifsRes.data ?? []) as Notification[]

  return (
    <OrgProvider value={{ user: me.user, org: me.org }}>
      <div className="app-shell min-h-screen">
        <Sidebar
          user={me.user}
          org={me.org}
          zapBadge={zapRes.count ?? 0}
          reelsBadge={pendingCount}
        />
        <div className="md:pl-[264px]">
          <Topbar
            user={me.user}
            org={me.org}
            initialNotifications={notifications}
            initialUnreadCount={unreadRes.count ?? 0}
          />
          <main className="px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl space-y-6">
              <PageHeader
                title="Reels"
                description={
                  pendingCount > 0
                    ? `${pendingCount} reel${pendingCount === 1 ? '' : 's'} waiting for approval.`
                    : 'Review, approve, and track every reel.'
                }
              />
              <ReelsGrid
                initial={items}
                isAdmin={me.user.role === 'superadmin'}
              />
            </div>
          </main>
        </div>
      </div>
    </OrgProvider>
  )
}
