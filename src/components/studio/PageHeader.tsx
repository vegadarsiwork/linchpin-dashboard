import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type PageHeaderProps = {
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        'border-b border-zinc-200 pb-5',
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="app-heading text-2xl font-semibold tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="app-subtle mt-2 text-sm">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  )
}
