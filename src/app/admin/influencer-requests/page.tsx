import { InfluencerRequestsAdmin } from '@/components/studio/marketplace/InfluencerRequestsAdmin'

export const dynamic = 'force-dynamic'

export default function InfluencerRequestsPage() {
  return (
    <div className="mx-auto max-w-[1280px] space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Creator Requests</h1>
        <p className="mt-0.5 text-sm text-zinc-500">Review client creator requests, confirm availability, and move campaigns into scripting.</p>
      </div>
      <InfluencerRequestsAdmin />
    </div>
  )
}
