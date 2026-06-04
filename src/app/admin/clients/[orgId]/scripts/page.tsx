import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/db/client'
import { AdminScriptsClient } from '@/components/studio/scripts/AdminScriptsClient'
import type { Script, ScriptComment } from '@/lib/types'

export const dynamic = 'force-dynamic'

type ScriptWithCampaign = Script & { campaigns: { id: string; name: string } | null }

export default async function AdminClientScriptsPage({
  params,
}: {
  params: Promise<{ orgId: string }>
}) {
  const { orgId } = await params
  const me = await getCurrentUser()
  if (!me) redirect('/dashboard/login')
  if (me.user.role !== 'superadmin') redirect('/dashboard')

  const admin = createAdminClient()

  const [orgRes, scriptsRes, campaignsRes, commentsRes] = await Promise.all([
    admin.from('organisations').select('id,name').eq('id', orgId).single(),
    admin
      .from('scripts')
      .select('*, campaigns(id,name)')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false }),
    admin
      .from('campaigns')
      .select('id,name')
      .eq('org_id', orgId)
      .order('name', { ascending: true }),
    admin
      .from('script_comments')
      .select('*')
      .in(
        'script_id',
        // subquery workaround: fetch script IDs first then filter comments
        await admin
          .from('scripts')
          .select('id')
          .eq('org_id', orgId)
          .then((r) => (r.data ?? []).map((s: { id: string }) => s.id))
      )
      .order('created_at', { ascending: false }),
  ])

  if (orgRes.error || !orgRes.data) notFound()

  const scripts = (scriptsRes.data ?? []) as ScriptWithCampaign[]
  const campaigns = (campaignsRes.data ?? []) as { id: string; name: string }[]
  const comments = (commentsRes.data ?? []) as ScriptComment[]

  return (
    <div className="mx-auto max-w-[1100px] space-y-6">
      <div>
        <Link
          href={`/admin/clients/${orgId}`}
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900"
        >
          <ChevronLeft className="h-4 w-4" /> {orgRes.data.name}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
          Scripts · {orgRes.data.name}
        </h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          Create, revise, and manage scripts for this client.
        </p>
      </div>

      <AdminScriptsClient
        orgId={orgId}
        scripts={scripts}
        campaigns={campaigns}
        allComments={comments}
      />
    </div>
  )
}
