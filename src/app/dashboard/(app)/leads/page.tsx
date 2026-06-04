import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/db/client'
import { LeadsClient } from '@/components/studio/leads/LeadsClient'
import type { Lead } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function LeadsPage() {
  const me = await getCurrentUser()
  if (!me) redirect('/dashboard/login')
  if (!me.org) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center">
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
  const { data } = await supabase
    .from('leads')
    .select('*')
    .eq('org_id', me.org.id)
    .order('created_at', { ascending: false })
    .limit(500)

  const leads = (data ?? []) as Lead[]

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <LeadsClient initial={leads} />
    </div>
  )
}
