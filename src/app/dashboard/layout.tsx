import type { ReactNode } from 'react'
import { GeistSans } from 'geist/font/sans'
import { Toaster } from 'sonner'
import './dashboard.css'

export const metadata = {
  title: 'Linchpin Studio',
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`dashboard-shell ${GeistSans.className}`}>
      {children}
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          style: { fontFamily: 'inherit' },
        }}
      />
    </div>
  )
}
