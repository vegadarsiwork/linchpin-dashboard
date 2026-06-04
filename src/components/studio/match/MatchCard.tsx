'use client'

interface Influencer {
  id: string
  name: string
  handle: string
  platform: string
  city: string | null
  follower_count: number | null
  engagement_rate: number | null
  rate_per_reel: number | null
  niches: string[] | null
  linchpin_rating: number | null
}

export interface EnrichedMatch {
  influencer_id: string
  score: number
  reasoning: string
  flags: string[]
  influencer: Influencer
}

function fmt(n: number | null): string {
  if (n === null) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

function scoreColors(score: number) {
  if (score >= 80) return { ring: 'ring-emerald-400', bg: 'bg-emerald-500' }
  if (score >= 60) return { ring: 'ring-amber-400', bg: 'bg-amber-500' }
  return { ring: 'ring-red-400', bg: 'bg-red-500' }
}

function platformAbbr(platform: string): string {
  const p = platform.toLowerCase()
  if (p.includes('instagram')) return 'IG'
  if (p.includes('youtube')) return 'YT'
  if (p.includes('linkedin')) return 'LI'
  if (p.includes('twitter') || p.includes('x.com')) return 'X'
  return platform.slice(0, 2).toUpperCase()
}

interface MatchCardProps {
  match: EnrichedMatch
  rank: number
  onSelect: () => void
}

export function MatchCard({ match, rank, onSelect }: MatchCardProps) {
  const { influencer: inf, score, reasoning, flags } = match
  const colors = scoreColors(score)
  const initials = inf.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className={`rounded-xl border border-zinc-200 bg-white p-5 ring-1 ${colors.ring} shadow-sm`}>
      <div className="flex items-start gap-4">
        {/* Avatar with rank badge */}
        <div className="relative flex-shrink-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
            {initials}
          </div>
          <span className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-bold text-white">
            {rank}
          </span>
        </div>

        {/* Name + score */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-900">{inf.name}</p>
              <p className="text-xs text-zinc-500">@{inf.handle}</p>
            </div>
            <div className={`flex flex-shrink-0 flex-col items-center rounded-lg px-2.5 py-1 ${colors.bg}`}>
              <span className="text-lg font-bold leading-none text-white">{score}</span>
              <span className="text-[10px] text-white/80">score</span>
            </div>
          </div>

          {/* Meta chips */}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-medium text-zinc-700">
              {platformAbbr(inf.platform)}
            </span>
            {inf.city && <span>{inf.city}</span>}
            {inf.follower_count !== null && <span>{fmt(inf.follower_count)} followers</span>}
            {inf.engagement_rate !== null && <span>{Number(inf.engagement_rate).toFixed(1)}% ER</span>}
            {inf.rate_per_reel !== null && <span>₹{fmt(inf.rate_per_reel)}/reel</span>}
          </div>

          {/* Niche pills */}
          {inf.niches && inf.niches.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {inf.niches.slice(0, 4).map((n) => (
                <span
                  key={n}
                  className="rounded-full border border-zinc-200 px-2 py-0.5 text-[11px] text-zinc-600"
                >
                  {n}
                </span>
              ))}
              {inf.niches.length > 4 && (
                <span className="rounded-full border border-zinc-200 px-2 py-0.5 text-[11px] text-zinc-400">
                  +{inf.niches.length - 4}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Match reasoning */}
      <div className="mt-4 rounded-lg bg-zinc-50 px-3 py-2.5 text-xs leading-relaxed text-zinc-700">
        {reasoning}
      </div>

      {/* Flags */}
      {flags.length > 0 && (
        <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <span className="font-medium">Note: </span>
          {flags.join(' · ')}
        </div>
      )}

      <button
        onClick={onSelect}
        className="mt-4 w-full rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-violet-700"
      >
        Select Creator →
      </button>
    </div>
  )
}
