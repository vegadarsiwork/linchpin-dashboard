'use client'

import {
  Bell,
  Calendar,
  FileVideo,
  Inbox,
  Megaphone,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const ICONS = {
  bell: Bell,
  calendar: Calendar,
  fileVideo: FileVideo,
  inbox: Inbox,
  megaphone: Megaphone,
} satisfies Record<string, LucideIcon>

export type EmptyStateIconKey = keyof typeof ICONS

export type EmptyStateProps = {
  icon?: LucideIcon
  iconKey?: EmptyStateIconKey
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
  className?: string
}

export function EmptyState({
  icon: Icon,
  iconKey,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const ResolvedIcon = Icon ?? (iconKey ? ICONS[iconKey] : Inbox)

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center px-6 py-12',
        className
      )}
    >
      <div className="h-12 w-12 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
        <ResolvedIcon className="h-6 w-6 text-zinc-400" />
      </div>
      <h3 className="text-base font-semibold text-zinc-900">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-zinc-500 max-w-sm">{description}</p>
      )}
      {action && (
        <Button
          variant="outline"
          size="sm"
          onClick={action.onClick}
          className="mt-5 border-violet-200 text-[#7C3AED] hover:bg-violet-50 hover:text-[#6D28D9]"
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}
