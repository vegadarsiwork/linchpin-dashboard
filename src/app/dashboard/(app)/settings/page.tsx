import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { PageHeader } from '@/components/studio'
import { SettingsClient } from './SettingsClient'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const me = await getCurrentUser()
  if (!me) redirect('/dashboard/login')

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-2">
      <PageHeader
        title="Settings"
        description="Manage your account, password, and notification preferences."
      />
      <SettingsClient user={me.user} />
    </div>
  )
}
