import { redirect, notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/db/client'
import { query } from '@/lib/db'
import { ScriptDetailClient } from '@/components/studio/scripts/ScriptDetailClient'
import type { Script, ScriptVersion, ScriptComment } from '@/lib/types'

export const dynamic = 'force-dynamic'

type ActivityRow = {
  id: string
  type: string
  title: string
  description: string | null
  created_at: string
}

type ScriptWithCampaign = Script & { campaigns: { id: string; name: string } | null }

export default async function ScriptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const me = await getCurrentUser()
  if (!me) redirect('/dashboard/login')
  if (!me.org) redirect('/dashboard')

  const supabase = createAdminClient()
  const { data: script, error } = await supabase
    .from('scripts')
    .select('*, campaigns(id,name)')
    .eq('id', id)
    .single()

  if (error || !script) notFound()
  if (script.org_id !== me.org.id) notFound()

  const admin = createAdminClient()
  const [versionsRes, commentsRes, timelineRows] = await Promise.all([
    admin
      .from('script_versions')
      .select('*')
      .eq('script_id', id)
      .order('version_number', { ascending: false }),
    admin
      .from('script_comments')
      .select('*')
      .eq('script_id', id)
      .order('created_at', { ascending: true }),
    query<ActivityRow>(
      `select id,type,title,description,created_at from activities
       where org_id = $1 and link like $2
       order by created_at asc limit 30`,
      [me.org.id, `%/scripts/${id}%`]
    ),
  ])

  return (
    <ScriptDetailClient
      script={script as ScriptWithCampaign}
      versions={(versionsRes.data ?? []) as ScriptVersion[]}
      comments={(commentsRes.data ?? []) as ScriptComment[]}
      timeline={timelineRows}
    />
  )
}
