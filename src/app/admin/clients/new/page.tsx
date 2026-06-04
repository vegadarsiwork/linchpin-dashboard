import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { NewClientForm } from '@/components/studio/NewClientForm'

export default function NewClientPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900"
        >
          <ChevronLeft className="h-4 w-4" /> Back to all clients
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
          New Client
        </h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          Set up an organisation, modules, brand context, and a client login.
        </p>
      </div>

      <NewClientForm />
    </div>
  )
}
