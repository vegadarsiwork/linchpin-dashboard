'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Lock, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface NavItemProps {
  href: string
  label: string
  icon: LucideIcon
  module?: string
  activeModules: string[]
  badge?: { count: number; tone: 'red' | 'amber' }
  exact?: boolean
}

export function NavItem({
  href,
  label,
  icon: Icon,
  module,
  activeModules,
  badge,
  exact,
}: NavItemProps) {
  const pathname = usePathname()
  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')
  const isLocked = !!module && !activeModules.includes(module)

  const base =
    'app-nav-item group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors'

  if (isLocked) {
    return (
      <div
        title="Contact your account manager to unlock this feature"
        aria-disabled
        className={cn(
          base,
          'app-nav-locked cursor-not-allowed select-none'
        )}
      >
        <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
        <span className="flex-1 truncate">{label}</span>
        <Lock className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
      </div>
    )
  }

  return (
    <Link
      href={href}
      className={cn(
        base,
        isActive
          ? 'app-nav-active shadow-sm'
          : ''
      )}
    >
      <Icon
        className={cn('h-4 w-4 shrink-0', isActive && 'drop-shadow-sm')}
        strokeWidth={isActive ? 2.4 : 2}
        fill={isActive ? 'currentColor' : 'none'}
        fillOpacity={isActive ? 0.18 : 0}
      />
      <span className="flex-1 truncate">{label}</span>
      {badge && badge.count > 0 && (
        <span
          className={cn(
            'inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold leading-none',
            badge.tone === 'red'
              ? 'bg-red-500 text-white'
              : 'bg-amber-400 text-amber-950',
            isActive && 'ring-1 ring-white/30'
          )}
        >
          {badge.count > 99 ? '99+' : badge.count}
        </span>
      )}
    </Link>
  )
}
