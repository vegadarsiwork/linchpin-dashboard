import { createAdminClient } from '@/lib/db/client'
import { ScriptGeneratorClient } from '@/components/studio/scripts/ScriptGeneratorClient'

export const dynamic = 'force-dynamic'

export default async function NewScriptPage({
  searchParams,
}: {
  searchParams: Promise<{ orgId?: string; influencerId?: string; matchRequestId?: string }>
}) {
  const params = await searchParams
  const admin = createAdminClient()
  const [orgsRes, influencersRes] = await Promise.all([
    admin.from('organisations').select('id,name,brand_category,target_audience,brand_tone').order('name', { ascending: true }),
    admin.from('influencers').select('id,name,handle,platform').eq('active', true).order('name', { ascending: true }),
  ])

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Generate Script</h1>
        <p className="mt-0.5 text-sm text-zinc-500">Create creator-specific reel concepts with OpenRouter.</p>
      </div>
      <ScriptGeneratorClient
        orgs={orgsRes.data ?? []}
        influencers={influencersRes.data ?? []}
        initialOrgId={params.orgId ?? ''}
        initialInfluencerId={params.influencerId ?? ''}
        initialMatchRequestId={params.matchRequestId ?? ''}
      />
    </div>
  )
}
