import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/db/client'
import { OrgProvider } from '@/lib/context/OrgContext'
import { Sidebar } from '@/components/studio/Sidebar'
import { Topbar } from '@/components/studio/Topbar'
import type { Notification } from '@/lib/types'

export default async function AppLayout({ children }: { children: ReactNode }) {
  const me = await getCurrentUser()
  if (!me) redirect('/dashboard/login')
  if (!me.user.org_id) redirect('/dashboard/login')

  const supabase = createAdminClient()
  const orgId = me.user.org_id

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

  const reelsBadge = reelsRes.count ?? 0
  const zapBadge = zapRes.count ?? 0
  const notifications = (notifsRes.data ?? []) as Notification[]
  const unreadCount = unreadRes.count ?? 0

  return (
    <OrgProvider value={{ user: me.user, org: me.org }}>
      <div className="app-shell min-h-screen">
        <Sidebar
          user={me.user}
          org={me.org}
          zapBadge={zapBadge}
          reelsBadge={reelsBadge}
        />
        <div className="md:pl-[264px]">
          <Topbar
            user={me.user}
            org={me.org}
            initialNotifications={notifications}
            initialUnreadCount={unreadCount}
          />
          <main className="px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </OrgProvider>
  )
}
