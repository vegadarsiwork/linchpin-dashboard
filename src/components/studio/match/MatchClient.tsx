'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { BriefForm, type OrgOption, type BriefState } from './BriefForm'
import { MatchCard, type EnrichedMatch } from './MatchCard'

interface PrevMatch {
  id: string
  created_at: string
  brief: Record<string, unknown>
  org_id: string
  selected_influencer_id: string | null
  organisations: { name: string }[] | null
  influencers: { name: string; handle: string }[] | null
}

interface MatchClientProps {
  orgs: OrgOption[]
  prevMatches: PrevMatch[]
}

export function MatchClient({ orgs, prevMatches }: MatchClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [matches, setMatches] = useState<EnrichedMatch[]>([])
  const [matchRequestId, setMatchRequestId] = useState<string | null>(null)
  const [currentBrief, setCurrentBrief] = useState<BriefState | null>(null)
  const [selected, setSelected] = useState<EnrichedMatch | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [prevOpen, setPrevOpen] = useState(false)

  async function handleSubmit(brief: BriefState) {
    setLoading(true)
    setError(null)
    setMatches([])
    setCurrentBrief(brief)

    try {
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brief),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong')
        return
      }

      setMatches(data.matches ?? [])
      setMatchRequestId(data.match_request_id ?? null)
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirm() {
    if (!selected || !currentBrief) return
    setConfirming(true)

    const orgName = orgs.find((o) => o.id === currentBrief.org_id)?.name ?? ''
    const briefSummary = [orgName, currentBrief.brand_category, currentBrief.goal, currentBrief.format]
      .filter(Boolean)
      .join(' · ')

    try {
      const res = await fetch('/api/match/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          match_request_id: matchRequestId,
          influencer_id: selected.influencer_id,
          org_id: currentBrief.org_id,
          brief_summary: briefSummary,
        }),
      })

      if (!res.ok) return

      setSelected(null)
      router.push(
        `/admin/scripts/new?orgId=${currentBrief.org_id}&influencerId=${selected.influencer_id}`
      )
    } finally {
      setConfirming(false)
    }
  }

  const selectedOrg = currentBrief ? orgs.find((o) => o.id === currentBrief.org_id) : null

  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      {/* Left panel */}
      <div className="space-y-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-zinc-900">Campaign Brief</h2>
          <BriefForm orgs={orgs} onSubmit={handleSubmit} loading={loading} />
        </div>

        {prevMatches.length > 0 && (
          <div className="rounded-xl border border-zinc-200 bg-white">
            <button
              type="button"
              className="flex w-full items-center justify-between px-5 py-3"
              onClick={() => setPrevOpen(!prevOpen)}
            >
              <span className="text-sm font-medium text-zinc-700">
                Previous Matches ({prevMatches.length})
              </span>
              {prevOpen ? (
                <ChevronUp className="h-4 w-4 text-zinc-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-zinc-400" />
              )}
            </button>

            {prevOpen && (
              <div className="border-t border-zinc-100">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50">
                      <th className="px-4 py-2 text-left font-medium text-zinc-500">Client</th>
                      <th className="px-4 py-2 text-left font-medium text-zinc-500">Matched</th>
                      <th className="px-4 py-2 text-left font-medium text-zinc-500">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prevMatches.map((pm) => (
                      <tr key={pm.id} className="border-b border-zinc-50 last:border-0">
                        <td className="px-4 py-2 text-zinc-700">
                          {pm.organisations?.[0]?.name ?? '—'}
                        </td>
                        <td className="px-4 py-2 text-zinc-600">
                          {pm.influencers?.[0] ? (
                            <>
                              {pm.influencers[0].name}{' '}
                              <span className="text-zinc-400">@{pm.influencers[0].handle}</span>
                            </>
                          ) : (
                            <span className="italic text-zinc-400">Pending</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-zinc-400">
                          {new Date(pm.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right panel */}
      <div>
        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-violet-100 bg-violet-50 py-24">
            <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
            <p className="text-sm font-medium text-violet-700">Scoring creator tags...</p>
            <p className="text-xs text-violet-500">This usually takes a moment</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-6 py-16 text-center">
            <p className="text-sm font-medium text-red-700">{error}</p>
            <button
              onClick={() => currentBrief && handleSubmit(currentBrief)}
              className="rounded-lg border border-red-200 bg-white px-4 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && matches.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-24 text-center">
            <p className="text-sm font-medium text-zinc-500">
              Fill a brief and click{' '}
              <span className="text-zinc-700">Find Best Matches</span>
            </p>
            <p className="text-xs text-zinc-400">Tag scoring will rank your top 5 from the roster</p>
          </div>
        )}

        {!loading && !error && matches.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-500">
              Top {matches.length} matches for{' '}
              <span className="font-semibold text-zinc-900">{selectedOrg?.name}</span>
            </p>
            {matches.map((m, i) => (
              <MatchCard
                key={m.influencer_id}
                match={m}
                rank={i + 1}
                onSelect={() => setSelected(m)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Confirm dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Match</DialogTitle>
          </DialogHeader>

          {selected && currentBrief && (
            <div className="space-y-3 py-2">
              <div className="rounded-lg bg-zinc-50 px-4 py-3">
                <p className="text-sm font-semibold text-zinc-900">{selected.influencer.name}</p>
                <p className="text-xs text-zinc-500">@{selected.influencer.handle}</p>
              </div>

              <div className="rounded-lg bg-zinc-50 px-4 py-3 text-xs text-zinc-600">
                <p className="mb-1 font-medium text-zinc-700">Brief summary</p>
                <p>
                  {[
                    selectedOrg?.name,
                    currentBrief.brand_category,
                    currentBrief.goal,
                    currentBrief.format,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>

              <p className="text-xs text-zinc-500">
                This will save the match and open the script editor for this creator and campaign.
              </p>
            </div>
          )}

          <DialogFooter>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={confirming}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {confirming ? 'Confirming…' : 'Confirm & Generate Script →'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
