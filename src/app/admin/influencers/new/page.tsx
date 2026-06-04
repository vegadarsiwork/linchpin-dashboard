import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { InfluencerForm } from '@/components/studio/influencers/InfluencerForm'

export const dynamic = 'force-dynamic'

export default function NewInfluencerPage() {
  return (
    <div className="mx-auto max-w-[800px] space-y-6">
      <div>
        <Link
          href="/admin/influencers"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900"
        >
          <ChevronLeft className="h-4 w-4" /> Influencers
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">Add Influencer</h1>
        <p className="mt-0.5 text-sm text-zinc-500">Fill in the details below to add a creator to the roster.</p>
      </div>
      <InfluencerForm />
    </div>
  )
}
