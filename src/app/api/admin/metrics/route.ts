import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/db/client'
import { requireSuperadminAPI } from '@/lib/admin/guard'

interface MetricInput {
  metric_key: string
  metric_value: number | null
  metric_change: number | null
  period: string
  source: string | null
}

export async function POST(req: NextRequest) {
  const guard = await requireSuperadminAPI()
  if (!guard.ok) return guard.res

  let body: { org_id: string; metrics: MetricInput[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!body.org_id || !Array.isArray(body.metrics)) {
    return NextResponse.json(
      { error: 'org_id and metrics[] required' },
      { status: 400 }
    )
  }

  const rows = body.metrics
    .filter((m) => m && m.metric_key && m.period)
    .map((m) => ({
      org_id: body.org_id,
      metric_key: m.metric_key,
      metric_value: m.metric_value,
      metric_change: m.metric_change,
      period: m.period,
      source: m.source,
      updated_at: new Date().toISOString(),
    }))

  if (rows.length === 0) {
    return NextResponse.json({ count: 0 })
  }

  const admin = createAdminClient()
  const { error, count } = await admin
    .from('metrics')
    .upsert(rows, { onConflict: 'org_id,metric_key,period', count: 'exact' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ count: count ?? rows.length })
}
