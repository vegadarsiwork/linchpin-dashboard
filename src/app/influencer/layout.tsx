import type { ReactNode } from 'react'
import { GeistSans } from 'geist/font/sans'
import { Toaster } from 'sonner'
import '../dashboard/dashboard.css'

export const metadata = {
  title: 'Creator Studio - Linchpin',
}

export default function InfluencerLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`influencer-route-shell ${GeistSans.className}`}>
      {children}
      <Toaster position="top-right" richColors closeButton />
    </div>
  )
}
