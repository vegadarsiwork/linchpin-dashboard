// Linchpin Studio domain types — mirror /supabase/migrations/001_initial_schema.sql

export type UserRole = 'superadmin' | 'client' | 'influencer'

export interface Organisation {
  id: string
  name: string
  slug: string
  logo_url: string | null
  plan: string | null
  status: string | null
  active_modules: string[]
  zap_enabled: boolean
  zap_org_id: string | null
  web_enabled: boolean
  account_manager_name: string | null
  account_manager_email: string | null
  account_manager_phone: string | null
  account_manager_avatar_url: string | null
  billing_cycle_start: string | null
  monthly_rate_inr: number | null
  brand_category: string | null
  brand_description: string | null
  target_audience: string | null
  brand_tone: string | null
  created_at: string
  updated_at: string
}

export type NotificationChannel = 'in_app' | 'email' | 'whatsapp'

export type NotificationPrefs = Record<string, NotificationChannel[]>

export interface User {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  role: UserRole
  org_id: string | null
  notification_prefs: NotificationPrefs | null
  created_at: string
  last_seen_at: string | null
}

export interface Metric {
  id: string
  org_id: string
  metric_key: string
  metric_value: number | null
  metric_change: number | null
  period: string
  source: string | null
  updated_at: string
}

export interface Activity {
  id: string
  org_id: string
  type: string
  title: string
  description: string | null
  link: string | null
  metadata: Record<string, unknown>
  is_read: boolean
  created_at: string
}

export interface Deliverable {
  id: string
  org_id: string
  title: string
  description: string | null
  module: string | null
  status: string
  due_date: string | null
  delivered_at: string | null
  created_at: string
  updated_at: string
}

export interface ContentItem {
  id: string
  org_id: string
  title: string
  type: string | null
  status: string
  caption: string | null
  hashtags: string[]
  asset_url: string | null
  asset_type: string | null
  asset_size_mb: number | null
  full_quality_url: string | null
  media_asset_id: string | null
  thumbnail_media_asset_id: string | null
  scheduled_for: string | null
  published_at: string | null
  platform: string | null
  client_feedback: string | null
  script_id: string | null
  influencer_id: string | null
  created_at: string
  updated_at: string
}

export interface ContentItemVersion {
  id: string
  content_item_id: string
  org_id: string
  version_number: number
  asset_url: string | null
  full_quality_url: string | null
  label: string | null
  uploaded_by: string | null
  created_at: string
}

export interface ReelCorrection {
  id: string
  content_item_id: string
  org_id: string
  user_id: string | null
  note: string
  version_number: number | null
  created_at: string
}

export interface ReelDownloadEvent {
  id: string
  content_item_id: string
  org_id: string
  user_id: string | null
  version_id: string | null
  downloaded_at: string
}

export interface Lead {
  id: string
  org_id: string
  name: string | null
  phone: string | null
  email: string | null
  source: string | null
  source_detail: string | null
  status: string
  notes: string | null
  follow_up_at: string | null
  follow_up_note: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Campaign {
  id: string
  org_id: string
  name: string
  type: string | null
  status: string
  stats: Record<string, unknown>
  started_at: string | null
  ended_at: string | null
  brief: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  org_id: string | null
  user_id: string | null
  type: string
  title: string
  body: string | null
  link: string | null
  channels: string[]
  sent_email: boolean
  sent_whatsapp: boolean
  is_read: boolean
  created_at: string
}

export interface Influencer {
  id: string
  user_id: string | null
  slug: string | null
  display_name: string | null
  name: string
  handle: string | null
  platform: string | null
  profile_url: string | null
  avatar_url: string | null
  city: string | null
  audience_regions: string[]
  languages: string[]
  niches: string[]
  content_styles: string[]
  follower_count: number | null
  engagement_rate: number | null
  audience_notes: string | null
  rate_per_reel: number | null
  rate_per_story: number | null
  availability: string | null
  linchpin_rating: number | null
  past_brand_categories: string[]
  avoid_categories: string[]
  competitor_brands: string[]
  notes: string | null
  public_visible: boolean
  public_bio: string | null
  price_range_min_inr: number | null
  price_range_max_inr: number | null
  sample_content_urls: string[]
  average_reel_views: number | null
  audience_age_range: string | null
  audience_gender_skew: string | null
  approval_status: string
  public_profile_completed: boolean
  profile_submitted_at: string | null
  approved_at: string | null
  rejected_at: string | null
  rejection_reason: string | null
  phone: string | null
  gender: string | null
  date_of_birth: string | null
  state: string | null
  cover_photo_url: string | null
  collaboration_types: string[]
  is_available: boolean
  preferred_campaign_types: string[]
  past_collaborations: Array<{ brand: string; year?: string; type?: string; description?: string }>
  profile_views: number
  platform_links: Record<string, string>
  platform_follower_counts: Record<string, number>
  active: boolean
  created_at: string
  updated_at: string
}

export interface InfluencerReel {
  id: string
  influencer_id: string
  title: string
  gif_url: string | null
  video_url: string | null
  thumbnail_url: string | null
  source_url: string | null
  media_asset_id: string | null
  thumbnail_media_asset_id: string | null
  category_tags: string[]
  is_featured: boolean
  approval_status: string
  created_at: string
  updated_at: string
  display_order: number
}

export interface MediaAsset {
  id: string
  org_id: string | null
  influencer_id: string | null
  owner_user_id: string | null
  created_by: string | null
  bucket: string
  object_key: string
  filename: string
  content_type: string
  size_bytes: number
  asset_kind: string
  access_scope: string
  status: string
  checksum_sha256: string | null
  provider: string
  provider_file_key: string | null
  url: string | null
  metadata: Record<string, unknown>
  uploaded_at: string | null
  created_at: string
  updated_at: string
}

export interface InfluencerCampaign {
  id: string
  influencer_id: string
  org_id: string | null
  brand_category: string | null
  campaign_goal: string | null
  content_style_used: string | null
  platform: string | null
  views: number
  likes: number
  comments: number
  shares: number
  saves: number
  reach: number
  leads_generated: number
  engagement_rate: number | null
  team_rating: number | null
  client_rating: number | null
  notes: string | null
  went_live_at: string | null
  script_id: string | null
  created_at: string
}

export interface Script {
  id: string
  org_id: string
  campaign_id: string | null
  title: string
  body: string | null
  brief: Record<string, unknown>
  variations: unknown[]
  selected_variation: number
  status: string
  influencer_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ScriptVersion {
  id: string
  script_id: string
  version_number: number
  body: string
  note: string | null
  created_by: string | null
  created_at: string
}

export interface ScriptComment {
  id: string
  script_id: string
  user_id: string | null
  paragraph_index: number | null
  selected_text: string | null
  comment: string
  resolved: boolean
  created_at: string
}

// ─── Clips ───────────────────────────────────────────────────────────────────

export type ClipStatus =
  | 'pending'
  | 'partially_reviewed'
  | 'approved'
  | 'changes_requested'

export type ClipElementType =
  | 'background_location'
  | 'voice_audio'
  | 'influencer_presence'

export type ClipElementStatus = 'pending' | 'approved' | 'flagged'

export interface Clip {
  id: string
  org_id: string
  campaign_id: string | null
  title: string
  duration_seconds: number | null
  preview_url: string | null
  full_quality_url: string | null
  status: ClipStatus
  admin_notes: string | null
  created_at: string
  updated_at: string
}

export interface ClipApprovalElement {
  id: string
  clip_id: string
  element_type: ClipElementType
  status: ClipElementStatus
  comment: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

export interface ClipWithRelations extends Clip {
  campaign_name: string | null
  elements: ClipApprovalElement[]
}

// ─────────────────────────────────────────────────────────────────────────────

export interface InfluencerMatchRequest {
  id: string
  org_id: string
  brief: Record<string, unknown>
  matches: unknown[]
  selected_influencer_id: string | null
  requested_influencer_id: string | null
  status: string
  request_source: string
  client_notes: string | null
  admin_notes: string | null
  confirmed_at: string | null
  declined_at: string | null
  created_by: string | null
  campaign_name: string | null
  campaign_start_date: string | null
  campaign_end_date: string | null
  deliverables: string | null
  budget_range: string | null
  requirements_notes: string | null
  created_at: string
  updated_at: string
}

export interface InfluencerRequestEvent {
  id: string
  request_id: string
  actor_user_id: string | null
  event_type: string
  note: string | null
  created_at: string
}

export interface PublicInfluencer {
  id: string
  slug: string | null
  display_name: string | null
  name: string
  handle: string | null
  platform: string | null
  profile_url: string | null
  avatar_url: string | null
  city: string | null
  audience_regions: string[]
  languages: string[]
  niches: string[]
  content_styles: string[]
  follower_count: number | null
  engagement_rate: number | null
  public_bio: string | null
  price_range_min_inr: number | null
  price_range_max_inr: number | null
  sample_content_urls: string[]
  average_reel_views: number | null
  audience_age_range: string | null
  audience_gender_skew: string | null
  availability: string | null
  gender: string | null
  is_available: boolean
  collaboration_types: string[]
  preferred_campaign_types: string[]
  past_collaborations: Array<{ brand: string; year?: string; type?: string; description?: string }>
  cover_photo_url: string | null
  platform_follower_counts: Record<string, number>
  featured_reel_url: string | null
}

export interface PublicInfluencerMatch {
  influencer_id: string
  score: number
  reasoning: string
  flags: string[]
  influencer: PublicInfluencer
}
