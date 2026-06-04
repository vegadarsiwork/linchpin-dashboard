import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/db/client'
import { PageHeader } from '@/components/studio'
import { AdminClipsView } from '@/components/studio/clips/AdminClipsView'
import type { ClipWithRelations } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function AdminClientClipsPage({
  params,
}: {
  params: Promise<{ orgId: string }>
}) {
  const me = await getCurrentUser()
  if (!me) redirect('/dashboard/login')
  if (me.user.role !== 'superadmin') redirect('/dashboard')

  const { orgId } = await params
  const admin = createAdminClient()

  const [orgRes, clipsRes, campaignsRes] = await Promise.all([
    admin.from('organisations').select('id, name').eq('id', orgId).single(),
    admin
      .from('clips')
      .select(`
        *,
        campaign:campaigns(id, name),
        elements:clip_approval_elements(*)
      `)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false }),
    admin
      .from('campaigns')
      .select('id, name')
      .eq('org_id', orgId)
      .order('name', { ascending: true }),
  ])

  if (orgRes.error || !orgRes.data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-zinc-900">Organisation not found</h1>
      </div>
    )
  }

  const clips: ClipWithRelations[] = ((clipsRes.data ?? []) as Record<string, unknown>[]).map((c) => ({
    id: c.id as string,
    org_id: c.org_id as string,
    campaign_id: c.campaign_id as string | null,
    title: c.title as string,
    duration_seconds: c.duration_seconds as number | null,
    preview_url: c.preview_url as string | null,
    full_quality_url: c.full_quality_url as string | null,
    status: c.status as ClipWithRelations['status'],
    admin_notes: c.admin_notes as string | null,
    created_at: c.created_at as string,
    updated_at: c.updated_at as string,
    campaign_name: Array.isArray(c.campaign)
      ? ((c.campaign as { name?: string }[])[0]?.name ?? null)
      : ((c.campaign as { name?: string } | null)?.name ?? null),
    elements: (c.elements ?? []) as ClipWithRelations['elements'],
  }))

  const campaigns = (campaignsRes.data ?? []) as { id: string; name: string }[]

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <Link
          href={`/admin/clients/${orgId}`}
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900"
        >
          <ChevronLeft className="h-4 w-4" /> {orgRes.data.name}
        </Link>
      </div>
      <PageHeader
        title={`Clips · ${orgRes.data.name}`}
        description="Add clips for client pre-reel approval and monitor the approval matrix."
      />
      <AdminClipsView
        orgId={orgId}
        initialClips={clips}
        campaigns={campaigns}
      />
    </div>
  )
}
