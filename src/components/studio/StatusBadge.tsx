import { cn } from '@/lib/utils'
import { STATUS_BADGES } from '@/lib/constants'

export type StatusBadgeProps = {
  status: string
  variant: 'content' | 'lead' | 'deliverable' | 'campaign'
  className?: string
}

export function StatusBadge({ status, variant, className }: StatusBadgeProps) {
  const map = STATUS_BADGES[variant]
  const style = map[status] ?? {
    bg: 'bg-zinc-100',
    text: 'text-zinc-700',
    label: status.replace(/_/g, ' '),
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-[11px] font-medium capitalize',
        style.text,
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {style.label}
    </span>
  )
}
