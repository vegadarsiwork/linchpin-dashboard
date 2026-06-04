'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

export interface TabDef {
  key: string
  label: string
  content: ReactNode
}

export function ClientDetailTabs({
  tabs,
  defaultTab,
}: {
  tabs: TabDef[]
  defaultTab?: string
}) {
  const router = useRouter()
  const params = useSearchParams()
  const initial = params.get('tab') || defaultTab || tabs[0].key
  const [active, setActive] = useState(initial)

  useEffect(() => {
    const t = params.get('tab')
    if (t && t !== active) setActive(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  function select(key: string) {
    setActive(key)
    const url = new URL(window.location.href)
    url.searchParams.set('tab', key)
    router.replace(url.pathname + url.search, { scroll: false })
  }

  const current = tabs.find((t) => t.key === active) ?? tabs[0]

  return (
    <div>
      <div className="border-b border-zinc-200">
        <nav className="-mb-px flex flex-wrap gap-x-1" aria-label="Tabs">
          {tabs.map((t) => {
            const isActive = t.key === current.key
            return (
              <button
                key={t.key}
                onClick={() => select(t.key)}
                className={cn(
                  'relative px-4 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'text-[#7C3AED]'
                    : 'text-zinc-500 hover:text-zinc-900'
                )}
              >
                {t.label}
                {isActive && (
                  <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[#7C3AED]" />
                )}
              </button>
            )
          })}
        </nav>
      </div>

      <div className="pt-6">{current.content}</div>
    </div>
  )
}
