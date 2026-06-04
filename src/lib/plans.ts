// Linchpin Studio plan catalogue. Display-only — billing is offline.

export type PlanKey = 'spark' | 'system' | 'scale'

export type PlanColor = 'gray' | 'purple' | 'amber'

export interface PlanDefinition {
  key: PlanKey
  label: string
  color: PlanColor
  features: string[]
}

export const planFeatures: Record<PlanKey, PlanDefinition> = {
  spark: {
    key: 'spark',
    label: 'Spark',
    color: 'gray',
    features: [
      'LinkedIn content (8 posts/month)',
      'Cold email setup & 1 campaign',
      '1 landing page',
      'Monthly performance report',
    ],
  },
  system: {
    key: 'system',
    label: 'System',
    color: 'purple',
    features: [
      'Reels content (10 pieces/month)',
      'Cold email + LinkedIn outreach',
      'Zap WhatsApp AI Agent',
      '1 landing page per quarter',
      'CRM & pipeline setup',
      'Monthly performance report',
    ],
  },
  scale: {
    key: 'scale',
    label: 'Scale',
    color: 'amber',
    features: [
      'Full content engine (20+ pieces/month)',
      'Cold email + LinkedIn + WhatsApp outreach',
      'Zap WhatsApp AI Agent',
      'Meta + Google Ads management',
      'Influencer reel campaigns',
      'Dedicated account strategist',
      'Weekly performance report',
    ],
  },
}

const PLAN_RANK: Record<PlanKey, number> = { spark: 0, system: 1, scale: 2 }

export function normalisePlanKey(plan: string | null | undefined): PlanKey {
  const k = (plan ?? '').toLowerCase()
  if (k === 'spark' || k === 'system' || k === 'scale') return k
  return 'spark'
}

export function getPlan(plan: string | null | undefined): PlanDefinition {
  return planFeatures[normalisePlanKey(plan)]
}

/**
 * Features from plans that sit *above* the current plan, flattened in tier
 * order. Useful for the "upgrade to unlock" list on the billing page.
 */
export function getLockedFeatures(plan: string | null | undefined): Array<{
  feature: string
  fromPlan: PlanDefinition
}> {
  const current = PLAN_RANK[normalisePlanKey(plan)]
  const higher = (Object.keys(planFeatures) as PlanKey[]).filter(
    (k) => PLAN_RANK[k] > current
  )
  return higher.flatMap((k) =>
    planFeatures[k].features.map((feature) => ({
      feature,
      fromPlan: planFeatures[k],
    }))
  )
}

export const PLAN_BADGE_STYLES: Record<
  PlanColor,
  { bg: string; text: string; ring: string; chip: string }
> = {
  gray: {
    bg: 'bg-zinc-100',
    text: 'text-zinc-700',
    ring: 'ring-zinc-200',
    chip: 'bg-zinc-900 text-white',
  },
  purple: {
    bg: 'bg-violet-100',
    text: 'text-[#6D28D9]',
    ring: 'ring-violet-200',
    chip: 'bg-[#7C3AED] text-white',
  },
  amber: {
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    ring: 'ring-amber-200',
    chip: 'bg-amber-500 text-white',
  },
}
