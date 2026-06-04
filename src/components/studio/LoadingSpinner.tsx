import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type LoadingSpinnerProps = {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
}

const SIZE: Record<NonNullable<LoadingSpinnerProps['size']>, string> = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-9 w-9',
}

export function LoadingSpinner({
  size = 'md',
  className,
  label,
}: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('inline-flex items-center gap-2 text-[#7C3AED]', className)}
    >
      <Loader2 className={cn('animate-spin', SIZE[size])} />
      {label && <span className="text-sm text-zinc-600">{label}</span>}
      <span className="sr-only">Loading</span>
    </div>
  )
}
