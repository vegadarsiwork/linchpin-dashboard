import { createAdminClient } from '@/lib/db/client'
import { ZapEscalationBanner } from './ZapEscalationBanner'

export async function ZapEscalationSection({ orgId }: { orgId: string }) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('metrics')
    .select('metric_value')
    .eq('org_id', orgId)
    .eq('metric_key', 'whatsapp_escalations_open')
    .maybeSingle()

  const count = Math.max(0, Math.floor(Number(data?.metric_value ?? 0)))
  if (count <= 0) return null
  return <ZapEscalationBanner count={count} />
}
