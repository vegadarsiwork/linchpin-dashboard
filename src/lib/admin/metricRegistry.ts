// Metric registry: maps module → metric keys + display labels.
// Used by /admin/clients/[orgId] Metrics tab to render input rows.

export type MetricPeriod = 'week' | 'month'

export interface MetricDef {
  key: string
  label: string
  module: string | 'core'
  defaultPeriod: MetricPeriod
  defaultSource?: string
  format?: 'number' | 'currency' | 'percent'
}

export const METRIC_REGISTRY: MetricDef[] = [
  // content
  { key: 'reels_published', label: 'Reels Published', module: 'content', defaultPeriod: 'week', defaultSource: 'manual' },
  { key: 'reels_reach', label: 'Reach', module: 'content', defaultPeriod: 'week', defaultSource: 'instagram' },
  { key: 'reels_engagement', label: 'Engagement', module: 'content', defaultPeriod: 'week', defaultSource: 'instagram' },
  { key: 'reels_views', label: 'Total Views', module: 'content', defaultPeriod: 'week', defaultSource: 'instagram' },
  // leads
  { key: 'leads_total', label: 'Leads', module: 'leads', defaultPeriod: 'week', defaultSource: 'manual' },
  { key: 'leads_qualified', label: 'Qualified Leads', module: 'leads', defaultPeriod: 'week', defaultSource: 'manual' },
  { key: 'leads_converted', label: 'Converted', module: 'leads', defaultPeriod: 'week', defaultSource: 'manual' },
  { key: 'conversion_rate', label: 'Conversion Rate', module: 'leads', defaultPeriod: 'month', defaultSource: 'manual', format: 'percent' },
  // outreach
  { key: 'emails_sent', label: 'Emails Sent', module: 'outreach', defaultPeriod: 'week', defaultSource: 'manual' },
  { key: 'replies_received', label: 'Replies', module: 'outreach', defaultPeriod: 'week', defaultSource: 'manual' },
  { key: 'meetings_booked', label: 'Meetings Booked', module: 'outreach', defaultPeriod: 'week', defaultSource: 'manual' },
  // zap
  { key: 'zap_messages_handled', label: 'Messages Handled', module: 'zap', defaultPeriod: 'week', defaultSource: 'zap' },
  { key: 'zap_escalations', label: 'Escalations', module: 'zap', defaultPeriod: 'week', defaultSource: 'zap' },
  // web
  { key: 'site_visitors', label: 'Site Visitors', module: 'web', defaultPeriod: 'month', defaultSource: 'analytics' },
  { key: 'site_signups', label: 'Signups', module: 'web', defaultPeriod: 'month', defaultSource: 'analytics' },
  // ads
  { key: 'ads_spend', label: 'Ad Spend', module: 'ads', defaultPeriod: 'month', defaultSource: 'manual', format: 'currency' },
  { key: 'ads_impressions', label: 'Impressions', module: 'ads', defaultPeriod: 'month', defaultSource: 'manual' },
  { key: 'ads_clicks', label: 'Clicks', module: 'ads', defaultPeriod: 'month', defaultSource: 'manual' },
  { key: 'ads_cpl', label: 'Cost / Lead', module: 'ads', defaultPeriod: 'month', defaultSource: 'manual', format: 'currency' },
  // influencer
  { key: 'influencer_campaigns_active', label: 'Active Campaigns', module: 'influencer', defaultPeriod: 'month', defaultSource: 'manual' },
  { key: 'influencer_reach', label: 'Influencer Reach', module: 'influencer', defaultPeriod: 'month', defaultSource: 'manual' },
]

export function metricsForModules(activeModules: string[]): MetricDef[] {
  return METRIC_REGISTRY.filter(
    (m) => m.module === 'core' || activeModules.includes(m.module)
  )
}
