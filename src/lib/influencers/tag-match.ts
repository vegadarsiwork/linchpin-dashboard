type BriefLike = {
  brand_category?: string | null
  target_audience?: string | null
  goal?: string | null
  format?: string | null
  language?: string | null
  tone?: string | null
  budget_min?: number | null
  budget_max?: number | null
  timeline?: string | null
  notes?: string | null
}

type InfluencerLike = {
  id: string
  name: string
  city?: string | null
  audience_regions?: unknown
  languages?: unknown
  niches?: unknown
  content_styles?: unknown
  follower_count?: number | null
  engagement_rate?: number | null
  rate_per_reel?: number | null
  price_range_min_inr?: number | null
  price_range_max_inr?: number | null
  average_reel_views?: number | null
  availability?: string | null
  linchpin_rating?: number | null
  past_brand_categories?: unknown
  avoid_categories?: unknown
}

export type TagMatch = {
  influencer_id: string
  score: number
  reasoning: string
  flags: string[]
  matched_tags: string[]
}

function asArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : []
}

function words(value: unknown): string[] {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length >= 3)
}

function hasOverlap(source: string[], targets: string[]): string[] {
  const normalizedSource = source.map((item) => item.toLowerCase())
  const normalizedTargets = targets.map((item) => item.toLowerCase())
  return source.filter((item, index) => {
    const src = normalizedSource[index]
    return normalizedTargets.some((target) => target.includes(src) || src.includes(target))
  })
}

function containsAny(textWords: string[], tags: string[]): string[] {
  return tags.filter((tag) => {
    const tagWords = words(tag)
    return tagWords.some((tagWord) => textWords.includes(tagWord))
  })
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)))
}

function availabilityScore(value: string | null | undefined): { score: number; flag?: string } {
  const availability = String(value ?? '').toLowerCase()
  if (!availability || availability === 'active' || availability === 'available') return { score: 10 }
  if (availability.includes('busy')) return { score: 5, flag: 'May need availability confirmation' }
  if (availability.includes('unavailable')) return { score: 0, flag: 'Currently marked unavailable' }
  return { score: 6 }
}

function budgetScore(brief: BriefLike, influencer: InfluencerLike): { score: number; flag?: string } {
  const budgetMax = brief.budget_max ?? null
  const budgetMin = brief.budget_min ?? null
  const min = influencer.price_range_min_inr ?? influencer.rate_per_reel ?? null
  const max = influencer.price_range_max_inr ?? influencer.rate_per_reel ?? null

  if (budgetMax == null || (min == null && max == null)) return { score: 10 }
  if (min != null && min <= budgetMax) return { score: 15 }
  if (budgetMin != null && max != null && max >= budgetMin && min != null && min <= budgetMax * 1.15) {
    return { score: 11, flag: 'Slightly above the preferred budget' }
  }
  return { score: 3, flag: 'Likely above the selected budget range' }
}

export function rankInfluencersByTags<T extends InfluencerLike>(
  brief: BriefLike,
  influencers: T[]
): Array<TagMatch & { influencer: T }> {
  const briefText = words([
    brief.brand_category,
    brief.target_audience,
    brief.goal,
    brief.format,
    brief.language,
    brief.tone,
    brief.timeline,
    brief.notes,
  ].join(' '))

  const categoryWords = words(brief.brand_category)
  const audienceWords = words(brief.target_audience)
  const toneWords = words(brief.tone)
  const language = String(brief.language ?? '').toLowerCase()

  return influencers
    .map((influencer) => {
      const niches = asArray(influencer.niches)
      const styles = asArray(influencer.content_styles)
      const languages = asArray(influencer.languages)
      const regions = asArray(influencer.audience_regions)
      const pastCategories = asArray(influencer.past_brand_categories)
      const avoidCategories = asArray(influencer.avoid_categories)
      const matchedTags: string[] = []
      const flags: string[] = []
      let score = 0

      const nicheMatches = containsAny(briefText, niches)
      if (nicheMatches.length > 0) {
        score += Math.min(24, 12 + nicheMatches.length * 6)
        matchedTags.push(...nicheMatches)
      }

      const categoryMatches = hasOverlap(pastCategories, [brief.brand_category ?? '', ...categoryWords])
      if (categoryMatches.length > 0) {
        score += 18
        matchedTags.push(...categoryMatches)
      }

      const styleMatches = containsAny([...briefText, ...toneWords], styles)
      if (styleMatches.length > 0) {
        score += Math.min(16, 8 + styleMatches.length * 4)
        matchedTags.push(...styleMatches)
      }

      if (language && languages.map((item) => item.toLowerCase()).includes(language)) {
        score += 12
        matchedTags.push(brief.language ?? '')
      } else if (languages.length > 0 && !language) {
        score += 6
      }

      const regionMatches = containsAny(audienceWords, [influencer.city ?? '', ...regions])
      if (regionMatches.length > 0) {
        score += 12
        matchedTags.push(...regionMatches)
      }

      const budget = budgetScore(brief, influencer)
      score += budget.score
      if (budget.flag) flags.push(budget.flag)

      const availability = availabilityScore(influencer.availability)
      score += availability.score
      if (availability.flag) flags.push(availability.flag)

      const engagement = influencer.engagement_rate ?? 0
      if (engagement >= 6) score += 8
      else if (engagement >= 4) score += 5
      else if (engagement > 0) score += 2

      const rating = influencer.linchpin_rating ?? 0
      if (rating >= 5) score += 5
      else if (rating >= 4) score += 3

      const avoidMatches = containsAny(categoryWords, avoidCategories)
      if (avoidMatches.length > 0) {
        score -= 18
        flags.push(`Avoid category overlap: ${avoidMatches.join(', ')}`)
      }

      const uniqueTags = [...new Set(matchedTags.filter(Boolean))].slice(0, 6)
      const publicReason = uniqueTags.length > 0
        ? `Strong tag fit across ${uniqueTags.slice(0, 4).join(', ')}. ${influencer.name} also has ${engagement ? `${engagement}% engagement` : 'relevant audience signals'}${influencer.city ? ` and reach in ${influencer.city}` : ''}.`
        : `${influencer.name} is a broad fit for this brief based on availability, budget, and performance signals.`

      return {
        influencer_id: influencer.id,
        score: clampScore(score),
        reasoning: publicReason,
        flags: flags.slice(0, 3),
        matched_tags: uniqueTags,
        influencer,
      }
    })
    .filter((match) => match.score >= 25)
    .sort((a, b) => b.score - a.score)
}
