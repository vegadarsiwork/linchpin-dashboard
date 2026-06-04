import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/db/client'
import { PageHeader, EmptyState } from '@/components/studio'
import type { Notification } from '@/lib/types'
import { NotificationsList } from './NotificationsList'
import { NOTIFICATION_TYPE_META } from '@/lib/constants'

export const dynamic = 'force-dynamic'

const PER_PAGE = 20

type Filter = 'all' | 'unread'

interface PageProps {
  searchParams: Promise<{
    page?: string
    filter?: string
    type?: string
  }>
}

export default async function NotificationsPage({ searchParams }: PageProps) {
  const me = await getCurrentUser()
  if (!me) redirect('/dashboard/login')
  if (!me.user.org_id) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center text-sm text-zinc-500">
        Your account isn&apos;t linked to an organisation yet.
      </div>
    )
  }

  const sp = await searchParams
  const page = Math.max(1, Number(sp.page ?? 1) || 1)
  const filter: Filter = sp.filter === 'unread' ? 'unread' : 'all'
  const type = sp.type && sp.type !== 'all' ? sp.type : null

  const supabase = createAdminClient()

  let query = supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('org_id', me.user.org_id)
    .order('created_at', { ascending: false })

  if (filter === 'unread') query = query.eq('is_read', false)
  if (type) query = query.eq('type', type)

  const from = (page - 1) * PER_PAGE
  const to = from + PER_PAGE - 1
  const { data, count } = await query.range(from, to)

  const notifications = (data ?? []) as Notification[]
  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))

  // Distinct types from constants for the filter dropdown.
  const typeOptions = Object.keys(NOTIFICATION_TYPE_META).filter(
    (k) => k !== 'default'
  )

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-2">
      <PageHeader
        title="Notifications"
        description="Everything we've flagged for your attention."
      />

      <NotificationsList
        notifications={notifications}
        total={total}
        page={page}
        totalPages={totalPages}
        filter={filter}
        type={type}
        typeOptions={typeOptions}
      />

      {total === 0 && (
        <EmptyState
          iconKey="bell"
          title="No notifications yet"
          description="We'll let you know when something needs your attention."
        />
      )}

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} filter={filter} type={type} />
      )}
    </div>
  )
}

function Pagination({
  page,
  totalPages,
  filter,
  type,
}: {
  page: number
  totalPages: number
  filter: Filter
  type: string | null
}) {
  function hrefFor(p: number) {
    const params = new URLSearchParams()
    if (p > 1) params.set('page', String(p))
    if (filter !== 'all') params.set('filter', filter)
    if (type) params.set('type', type)
    const qs = params.toString()
    return qs ? `/dashboard/notifications?${qs}` : '/dashboard/notifications'
  }
  const prev = Math.max(1, page - 1)
  const next = Math.min(totalPages, page + 1)
  return (
    <div className="flex items-center justify-between border-t border-zinc-200 pt-4 text-sm">
      <span className="text-zinc-500">
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        <Link
          href={hrefFor(prev)}
          aria-disabled={page === 1}
          className={
            page === 1
              ? 'pointer-events-none rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-zinc-400'
              : 'rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-zinc-700 hover:bg-zinc-50'
          }
        >
          Previous
        </Link>
        <Link
          href={hrefFor(next)}
          aria-disabled={page === totalPages}
          className={
            page === totalPages
              ? 'pointer-events-none rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-zinc-400'
              : 'rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-zinc-700 hover:bg-zinc-50'
          }
        >
          Next
        </Link>
      </div>
    </div>
  )
}
