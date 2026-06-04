import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Bot, MessageCircle, ShieldAlert } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/db/client'
import { PageHeader } from '@/components/studio'

export const dynamic = 'force-dynamic'

type NotificationRow = {
  id: string
  title: string
  body: string | null
  created_at: string
  is_read: boolean
}

export default async function ZapPage() {
  const me = await getCurrentUser()
  if (!me) redirect('/dashboard/login')
  if (!me.org) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center text-sm text-zinc-500">
        Your account is not linked to an organisation yet.
      </div>
    )
  }

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('notifications')
    .select('id,title,body,created_at,is_read')
    .eq('org_id', me.org.id)
    .in('type', ['zap_escalation', 'escalation'])
    .order('created_at', { ascending: false })
    .limit(20)

  const escalations = (data ?? []) as NotificationRow[]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Zap"
        description="WhatsApp AI agent activity, escalations, and handoff status."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <div className="app-panel rounded-lg p-4">
          <div className="app-icon-surface flex h-9 w-9 items-center justify-center">
            <Bot className="h-4 w-4" />
          </div>
          <div className="app-heading mt-4 text-2xl font-semibold">
            {me.org.zap_enabled ? 'Active' : 'Off'}
          </div>
          <div className="app-subtle mt-1 text-sm">Agent status</div>
        </div>
        <div className="app-panel rounded-lg p-4">
          <div className="app-icon-surface flex h-9 w-9 items-center justify-center">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div className="app-heading mt-4 text-2xl font-semibold">
            {escalations.filter((item) => !item.is_read).length}
          </div>
          <div className="app-subtle mt-1 text-sm">Open escalations</div>
        </div>
        <div className="app-panel rounded-lg p-4">
          <div className="app-icon-surface flex h-9 w-9 items-center justify-center">
            <MessageCircle className="h-4 w-4" />
          </div>
          <div className="app-heading mt-4 text-2xl font-semibold">
            {me.org.zap_org_id || 'Pending'}
          </div>
          <div className="app-subtle mt-1 text-sm">Zap org ID</div>
        </div>
      </section>

      <section className="app-panel rounded-lg">
        <div className="border-b border-zinc-200 px-4 py-3">
          <h2 className="app-heading text-sm font-semibold">Recent handoffs</h2>
          <p className="app-subtle mt-0.5 text-xs">
            Conversations that needed human review or follow-up.
          </p>
        </div>
        <div className="divide-y divide-zinc-100">
          {escalations.map((item) => (
            <Link
              key={item.id}
              href="/dashboard/notifications"
              className="block px-4 py-3 transition-colors hover:bg-zinc-50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="app-heading text-sm font-medium">{item.title}</div>
                  {item.body && (
                    <p className="app-subtle mt-1 line-clamp-2 text-xs">
                      {item.body}
                    </p>
                  )}
                </div>
                {!item.is_read && (
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-violet-600" />
                )}
              </div>
              <div className="app-subtle mt-2 text-[11px]">
                {new Date(item.created_at).toLocaleString('en-IN')}
              </div>
            </Link>
          ))}
          {escalations.length === 0 && (
            <div className="app-subtle px-4 py-10 text-center text-sm">
              No Zap escalations yet.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
