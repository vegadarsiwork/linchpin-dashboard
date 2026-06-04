'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, X } from 'lucide-react'

const SESSION_KEY = 'lp:zap-escalation-dismissed'

export function ZapEscalationBanner({ count }: { count: number }) {
  // Start dismissed-true to avoid SSR/CSR flash; reveal on mount if not dismissed.
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    setDismissed(sessionStorage.getItem(SESSION_KEY) === '1')
  }, [])

  if (count <= 0 || dismissed) return null

  function dismiss() {
    sessionStorage.setItem(SESSION_KEY, '1')
    setDismissed(true)
  }

  return (
    <div
      role="alert"
      className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800"
    >
      <span className="relative inline-flex h-2.5 w-2.5 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">
          {count} WhatsApp conversation{count === 1 ? '' : 's'} need your attention
        </p>
        <p className="text-xs text-red-700/80">
          Customers are waiting. Your Zap agent has flagged these.
        </p>
      </div>
      <Link
        href="/dashboard/zap"
        className="inline-flex items-center gap-1 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
      >
        View now <ArrowRight className="h-3 w-3" />
      </Link>
      <button
        type="button"
        onClick={dismiss}
        className="rounded-md p-1 text-red-700/70 hover:bg-red-100 hover:text-red-900"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
