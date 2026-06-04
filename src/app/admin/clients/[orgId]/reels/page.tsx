import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/db/client'
import { PageHeader } from '@/components/studio'
import { ReelsTable } from '@/components/studio/admin/ReelsTable'
import type { ContentItem } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function AdminClientReelsPage({
  params,
}: {
  params: Promise<{ orgId: string }>
}) {
  const me = await getCurrentUser()
  if (!me) redirect('/dashboard/login')
  if (me.user.role !== 'superadmin') redirect('/dashboard')

  const { orgId } = await params
  const supabase = createAdminClient()

  const [orgRes, contentRes, scriptsRes, influencersRes] = await Promise.all([
    supabase.from('organisations').select('id, name').eq('id', orgId).single(),
    supabase
      .from('content_items')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false }),
    supabase
      .from('scripts')
      .select('id, title')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false }),
    supabase
      .from('influencers')
      .select('id, name, handle')
      .eq('active', true)
      .order('name', { ascending: true }),
  ])

  if (orgRes.error || !orgRes.data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-zinc-900">
          Organisation not found
        </h1>
      </div>
    )
  }

  const items = (contentRes.data ?? []) as ContentItem[]
  const scripts = (scriptsRes.data ?? []) as { id: string; title: string }[]
  const influencers = (influencersRes.data ?? []) as {
    id: string
    name: string
    handle: string | null
  }[]

  const scriptMap: Record<string, { id: string; title: string }> = {}
  scripts.forEach((s) => (scriptMap[s.id] = s))
  const influencerMap: Record<
    string,
    { id: string; name: string; handle: string | null }
  > = {}
  influencers.forEach((i) => (influencerMap[i.id] = i))

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <PageHeader
        title={`Reels · ${orgRes.data.name}`}
        description="Upload reels and manage approvals for this client."
      />
      <ReelsTable
        orgId={orgId}
        items={items}
        scripts={scripts}
        influencers={influencers}
        scriptMap={scriptMap}
        influencerMap={influencerMap}
      />
    </div>
  )
}
