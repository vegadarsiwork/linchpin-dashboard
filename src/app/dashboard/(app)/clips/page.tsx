import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/db/client'
import { PageHeader } from '@/components/studio'
import { ClipsGrid } from '@/components/studio/clips/ClipsGrid'
import type { ClipWithRelations } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function ClipsDashboardPage() {
  const me = await getCurrentUser()
  if (!me) redirect('/dashboard/login')
  if (!me.user.org_id) redirect('/dashboard/login')

  const orgId = me.user.org_id
  const supabase = createAdminClient()

  const { data: rawClips } = await supabase
    .from('clips')
    .select(`
      *,
      campaign:campaigns(id, name),
      elements:clip_approval_elements(*)
    `)
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  const clips: ClipWithRelations[] = ((rawClips ?? []) as Record<string, unknown>[]).map((c) => ({
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clips"
        description="Review clips before they go live. Approve or flag each element, then submit your decision."
      />
      <ClipsGrid initial={clips} />
    </div>
  )
}
