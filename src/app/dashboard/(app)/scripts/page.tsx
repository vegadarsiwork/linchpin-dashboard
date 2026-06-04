import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/db/client'
import { ScriptsClient } from '@/components/studio/scripts/ScriptsClient'
import type { Script } from '@/lib/types'

export const dynamic = 'force-dynamic'

type ScriptWithCampaign = Script & { campaigns: { id: string; name: string } | null }

export default async function ScriptsPage() {
  const me = await getCurrentUser()
  if (!me) redirect('/dashboard/login')
  if (!me.org) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center">
        <h1 className="text-xl font-semibold text-zinc-900">Account not yet provisioned</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Your account isn&apos;t linked to an organisation yet.
        </p>
      </div>
    )
  }

  const supabase = createAdminClient()
  const [scriptsRes, campaignsRes] = await Promise.all([
    supabase
      .from('scripts')
      .select('id,org_id,campaign_id,title,body,status,created_at,updated_at,campaigns(id,name)')
      .eq('org_id', me.org.id)
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('campaigns')
      .select('id,name')
      .eq('org_id', me.org.id)
      .order('name', { ascending: true }),
  ])

  const scripts = (scriptsRes.data ?? []) as ScriptWithCampaign[]
  const campaigns = (campaignsRes.data ?? []) as { id: string; name: string }[]

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <ScriptsClient initial={scripts} campaigns={campaigns} />
    </div>
  )
}
