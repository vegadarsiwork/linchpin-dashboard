import { redirect } from 'next/navigation'
import { Check, Lock, Mail, MessageCircle, Sparkles } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { PageHeader } from '@/components/studio'
import {
  PLAN_BADGE_STYLES,
  getLockedFeatures,
  getPlan,
  normalisePlanKey,
} from '@/lib/plans'
import { formatINR } from '@/lib/utils/format'
import { formatDate } from '@/lib/utils/dates'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

function addOneMonth(iso: string): Date {
  const d = new Date(iso)
  const next = new Date(d)
  next.setMonth(next.getMonth() + 1)
  return next
}

export default async function BillingPage() {
  const me = await getCurrentUser()
  if (!me) redirect('/dashboard/login')
  if (!me.org) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center text-sm text-zinc-500">
        Your account isn&apos;t linked to an organisation yet. Contact your
        account manager.
      </div>
    )
  }

  const org = me.org
  const planKey = normalisePlanKey(org.plan)
  const plan = getPlan(planKey)
  const styles = PLAN_BADGE_STYLES[plan.color]
  const locked = getLockedFeatures(planKey)

  const activeSince = org.billing_cycle_start
    ? formatDate(org.billing_cycle_start)
    : null
  const nextBilling = org.billing_cycle_start
    ? formatDate(addOneMonth(org.billing_cycle_start))
    : null

  const amName = org.account_manager_name
  const amEmail = org.account_manager_email
  const amPhone = org.account_manager_phone
  const waNumber = (() => {
    if (!amPhone) return null
    const cleaned = amPhone.replace(/[^0-9]/g, '')
    if (!cleaned) return null
    return cleaned.startsWith('91') ? cleaned : `91${cleaned}`
  })()

  const showUpgradeCta = planKey !== 'scale'

  return (
    <div className="mx-auto max-w-5xl space-y-8 py-2">
      <PageHeader
        title="Billing & Plan"
        description="Your active plan and what's included. Billing is handled by your account manager."
      />

      {/* Plan card */}
      <section className="app-panel overflow-hidden rounded-lg">
        <div className="flex items-start justify-between gap-6 px-6 py-6 sm:px-8 sm:py-7">
          <div className="min-w-0">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide',
                styles.bg,
                styles.text
              )}
            >
              <span
                className={cn(
                  'inline-block h-1.5 w-1.5 rounded-full',
                  plan.color === 'gray' && 'bg-zinc-500',
                  plan.color === 'purple' && 'bg-violet-600',
                  plan.color === 'amber' && 'bg-amber-500'
                )}
              />
              {plan.label} plan
            </span>
            <h2 className="app-heading mt-3 text-xl font-semibold tracking-tight">
              {plan.label} Plan
            </h2>
            <p className="app-subtle mt-1 text-sm">
              Current subscription on file.
            </p>
          </div>

          {org.monthly_rate_inr != null && (
            <div className="shrink-0 text-right">
              <div className="app-heading text-2xl font-semibold tracking-tight">
                {formatINR(org.monthly_rate_inr)}
              </div>
              <div className="app-subtle text-xs">per month</div>
            </div>
          )}
        </div>

        <div className="grid gap-4 border-t border-zinc-100 bg-zinc-50/40 px-6 py-5 sm:grid-cols-2 sm:px-8">
          <div>
            <div className="app-subtle text-[11px] font-medium uppercase tracking-wide">
              Active since
            </div>
            <div className="app-heading mt-1 text-sm font-medium">
              {activeSince ?? '—'}
            </div>
          </div>
          <div>
            <div className="app-subtle text-[11px] font-medium uppercase tracking-wide">
              Next billing
            </div>
            <div className="app-heading mt-1 text-sm font-medium">
              {nextBilling ?? '—'}
            </div>
          </div>
        </div>
      </section>

      {/* Included features */}
      <section className="app-panel rounded-lg p-6 sm:p-8">
        <h3 className="app-heading text-base font-semibold">
          Included in your plan
        </h3>
        <ul className="mt-4 space-y-3">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
              <span className="app-text text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        {locked.length > 0 && (
          <>
            <div className="mt-7 mb-3 flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-zinc-400" />
              <span className="app-subtle text-[11px] font-medium uppercase tracking-wide">
                Available on higher plans
              </span>
            </div>
            <ul className="space-y-3">
              {locked.map(({ feature, fromPlan }) => (
                <li
                  key={`${fromPlan.key}:${feature}`}
                  className="flex items-start gap-3"
                >
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
                    <Lock className="h-3 w-3" />
                  </span>
                  <span className="text-sm text-zinc-400">
                    {feature}
                    <span className="ml-2 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                      · {fromPlan.label}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* Upgrade CTA */}
      {showUpgradeCta && (
        <section className="app-muted-panel rounded-lg bg-violet-50/60 p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="app-heading text-base font-semibold">
                Want to unlock more?
              </h3>
              <p className="app-subtle mt-1 text-sm">
                Talk to your account manager about upgrading.
              </p>

              {amName ? (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <div className="text-sm">
                    <span className="app-subtle">Account Manager: </span>
                    <span className="app-heading font-medium">{amName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {waNumber && (
                      <a
                        href={`https://wa.me/${waNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
                      >
                        <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                      </a>
                    )}
                    {amEmail && (
                      <a
                        href={`mailto:${amEmail}`}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                      >
                        <Mail className="h-3.5 w-3.5" /> Email
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <a
                  href="mailto:hello@linchpinsoftsolution.com"
                  className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg bg-violet-600 px-3 text-xs font-medium text-white transition-colors hover:bg-violet-700"
                >
                  <Mail className="h-3.5 w-3.5" /> Contact us
                </a>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
