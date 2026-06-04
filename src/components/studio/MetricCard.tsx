'use client'

import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle,
  Clock,
  Eye,
  FileVideo,
  Mail,
  Megaphone,
  MessageSquare,
  Minus,
  Sparkles,
  UserPlus,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const ICONS = {
  alertCircle: AlertCircle,
  checkCircle: CheckCircle,
  clock: Clock,
  eye: Eye,
  fileVideo: FileVideo,
  mail: Mail,
  megaphone: Megaphone,
  messageSquare: MessageSquare,
  sparkles: Sparkles,
  userPlus: UserPlus,
} satisfies Record<string, LucideIcon>

export type MetricIconKey = keyof typeof ICONS

export type MetricCardProps = {
  label: string
  value: string | number
  change?: number
  icon?: LucideIcon
  iconKey?: MetricIconKey
  iconColor?: string
  period?: 'week' | 'month'
  isLoading?: boolean
}

export function MetricCard({
  label,
  value,
  change,
  icon: Icon,
  iconKey,
  iconColor,
  period = 'month',
  isLoading,
}: MetricCardProps) {
  if (isLoading) return <MetricCardSkeleton />
  const ResolvedIcon = Icon ?? (iconKey ? ICONS[iconKey] : undefined)

  const direction =
    change === undefined ? null : change > 0 ? 'up' : change < 0 ? 'down' : 'flat'

  const periodLabel = period === 'week' ? 'vs last week' : 'vs last month'

  return (
    <div
      className={cn(
        'app-panel group rounded-lg p-5 transition-colors',
        'hover:border-violet-200'
      )}
    >
      <div className="flex items-start justify-between">
        <span className="app-subtle text-xs font-medium uppercase tracking-wide">
          {label}
        </span>
        {ResolvedIcon && (
          <div
            className={cn(
              'app-icon-surface flex h-9 w-9 items-center justify-center',
              iconColor
            )}
          >
            <ResolvedIcon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="app-heading text-3xl font-semibold tracking-tight tabular-nums">
          {value}
        </span>
      </div>

      {direction !== null && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-medium tabular-nums',
              direction === 'up' && 'bg-emerald-50 text-emerald-700',
              direction === 'down' && 'bg-red-50 text-red-700',
              direction === 'flat' && 'bg-zinc-100 text-zinc-600'
            )}
          >
            {direction === 'up' && <ArrowUpRight className="h-3 w-3" />}
            {direction === 'down' && <ArrowDownRight className="h-3 w-3" />}
            {direction === 'flat' && <Minus className="h-3 w-3" />}
            {Math.abs(change!).toFixed(1)}%
          </span>
          <span className="app-subtle">{periodLabel}</span>
        </div>
      )}
    </div>
  )
}

function MetricCardSkeleton() {
  return (
    <div className="app-panel rounded-lg p-5">
      <div className="flex items-start justify-between">
        <div className="h-3 w-24 rounded bg-zinc-100 animate-pulse" />
        <div className="h-8 w-8 rounded-md bg-zinc-100 animate-pulse" />
      </div>
      <div className="mt-3 h-8 w-32 rounded bg-zinc-100 animate-pulse" />
      <div className="mt-3 h-4 w-28 rounded bg-zinc-100 animate-pulse" />
    </div>
  )
}
