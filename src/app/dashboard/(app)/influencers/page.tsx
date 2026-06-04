import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { InfluencerMarketplaceClient } from '@/components/studio/marketplace/InfluencerMarketplaceClient'

export const dynamic = 'force-dynamic'

export default async function InfluencersPage() {
  const me = await getCurrentUser()
  if (!me) redirect('/dashboard/login')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="app-heading text-2xl font-semibold tracking-tight">Influencers</h1>
        <p className="app-subtle mt-1 text-sm">
          Choose creators for reel campaigns and track requests with your Studio team.
        </p>
      </div>

      <InfluencerMarketplaceClient org={me.org} />
    </div>
  )
}
