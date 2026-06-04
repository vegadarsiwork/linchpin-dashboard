import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/db/client'
import { requireSuperadminAPI } from '@/lib/admin/guard'

interface ConfirmPayload {
  match_request_id: string | null
  influencer_id: string
  org_id: string
  brief_summary: string
}

export async function POST(req: NextRequest) {
  const guard = await requireSuperadminAPI()
  if (!guard.ok) return guard.res

  let body: ConfirmPayload
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.influencer_id || !body.org_id) {
    return NextResponse.json({ error: 'influencer_id and org_id required' }, { status: 400 })
  }

  const admin = createAdminClient()

  await Promise.all([
    body.match_request_id
      ? admin
          .from('influencer_match_requests')
          .update({ selected_influencer_id: body.influencer_id })
          .eq('id', body.match_request_id)
      : Promise.resolve(),

    admin.from('activities').insert({
      org_id: body.org_id,
      type: 'influencer_matched',
      title: 'Influencer matched for your campaign',
      description: body.brief_summary || null,
      metadata: {
        influencer_id: body.influencer_id,
        match_request_id: body.match_request_id,
      },
    }),
  ])

  return NextResponse.json({ ok: true })
}
