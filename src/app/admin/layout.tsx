import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { GeistSans } from 'geist/font/sans'
import { Toaster } from 'sonner'
import { getCurrentUser } from '@/lib/auth'
import { AdminSidebar } from '@/components/studio/AdminSidebar'
import '../dashboard/dashboard.css'

export const metadata = {
  title: 'Linchpin Studio — Internal',
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const me = await getCurrentUser()
  if (!me) redirect('/dashboard/login')
  if (me.user.role !== 'superadmin') redirect('/dashboard')

  return (
    <div className={`admin-shell ${GeistSans.className}`}>
      <div className="min-h-screen bg-[#fafafa]">
        <AdminSidebar user={me.user} />
        <div className="md:pl-[240px]">
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-zinc-200 bg-white/80 px-6 backdrop-blur-sm">
            <div className="flex min-w-0 items-center gap-2 pl-12 md:pl-0">
              <h1 className="truncate text-[15px] font-medium text-zinc-900">
                Internal console
              </h1>
            </div>
            <span className="inline-flex h-7 items-center rounded-full bg-zinc-900 px-2.5 text-[11px] font-semibold uppercase tracking-wide text-white">
              Superadmin
            </span>
          </header>
          <main className="px-6 py-8">{children}</main>
        </div>
      </div>
      <Toaster position="top-right" richColors closeButton />
    </div>
  )
}
