// Shared lookup tables — module colours, status colours, metric labels.

import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  CheckCircle2,
  FileVideo,
  Megaphone,
  MessageSquare,
  Sparkles,
  TrendingUp,
  UserPlus,
  Bell,
  Calendar,
  AlertTriangle,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────
// Module → tailwind classes (badge bg/text/border)
// ─────────────────────────────────────────────────────────────────
export const MODULE_COLORS: Record<
  string,
  { bg: string; text: string; ring: string; label: string }
> = {
  content:    { bg: 'bg-violet-100',  text: 'text-violet-700',  ring: 'ring-violet-200',  label: 'Content' },
  outreach:   { bg: 'bg-blue-100',    text: 'text-blue-700',    ring: 'ring-blue-200',    label: 'Outreach' },
  web:        { bg: 'bg-teal-100',    text: 'text-teal-700',    ring: 'ring-teal-200',    label: 'Web' },
  zap:        { bg: 'bg-emerald-100', text: 'text-emerald-700', ring: 'ring-emerald-200', label: 'Zap' },
  ads:        { bg: 'bg-orange-100',  text: 'text-orange-700',  ring: 'ring-orange-200',  label: 'Ads' },
  influencer: { bg: 'bg-pink-100',    text: 'text-pink-700',    ring: 'ring-pink-200',    label: 'Influencer' },
  strategy:   { bg: 'bg-zinc-100',    text: 'text-zinc-700',    ring: 'ring-zinc-200',    label: 'Strategy' },
  leads:      { bg: 'bg-blue-100',    text: 'text-blue-700',    ring: 'ring-blue-200',    label: 'Leads' },
  campaigns:  { bg: 'bg-orange-100',  text: 'text-orange-700',  ring: 'ring-orange-200',  label: 'Campaigns' },
}

export function getModuleColors(module: string | null | undefined) {
  if (!module) return MODULE_COLORS.strategy
  return MODULE_COLORS[module] ?? MODULE_COLORS.strategy
}

// ─────────────────────────────────────────────────────────────────
// Deliverable status → dot colour
// ─────────────────────────────────────────────────────────────────
export const DELIVERABLE_STATUS_DOT: Record<
  string,
  { dot: string; pulse: boolean; label: string }
> = {
  upcoming:    { dot: 'bg-zinc-400',    pulse: false, label: 'Upcoming' },
  pending:     { dot: 'bg-zinc-400',    pulse: false, label: 'Pending' },
  in_progress: { dot: 'bg-amber-500',   pulse: true,  label: 'In progress' },
  review:      { dot: 'bg-blue-500',    pulse: false, label: 'In review' },
  delivered:   { dot: 'bg-emerald-500', pulse: false, label: 'Delivered' },
  delayed:     { dot: 'bg-red-500',     pulse: false, label: 'Delayed' },
}

// ─────────────────────────────────────────────────────────────────
// Status badge variants — content / lead / deliverable / campaign
// ─────────────────────────────────────────────────────────────────
type BadgeStyle = { bg: string; text: string; label: string }

export const STATUS_BADGES: Record<
  'content' | 'lead' | 'deliverable' | 'campaign',
  Record<string, BadgeStyle>
> = {
  content: {
    draft:                 { bg: 'bg-zinc-100',    text: 'text-zinc-700',    label: 'Draft' },
    pending_approval:      { bg: 'bg-amber-100',   text: 'text-amber-700',   label: 'Pending approval' },
    review:                { bg: 'bg-blue-100',    text: 'text-blue-700',    label: 'In review' },
    scheduled:             { bg: 'bg-violet-100',  text: 'text-violet-700',  label: 'Scheduled' },
    published:             { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Published' },
    approved:              { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Approved' },
    rejected:              { bg: 'bg-red-100',     text: 'text-red-700',     label: 'Rejected' },
    correction_requested:  { bg: 'bg-orange-100',  text: 'text-orange-700',  label: 'Corrections requested' },
    correction_submitted:  { bg: 'bg-blue-100',    text: 'text-blue-700',    label: 'Revised' },
    final_approved:        { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Final approved' },
  },
  lead: {
    new:        { bg: 'bg-violet-100',  text: 'text-violet-700',  label: 'New' },
    contacted:  { bg: 'bg-blue-100',    text: 'text-blue-700',    label: 'Contacted' },
    qualified:  { bg: 'bg-amber-100',   text: 'text-amber-700',   label: 'Qualified' },
    converted:  { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Converted' },
    lost:       { bg: 'bg-zinc-100',    text: 'text-zinc-600',    label: 'Lost' },
  },
  deliverable: {
    upcoming:    { bg: 'bg-zinc-100',    text: 'text-zinc-700',    label: 'Upcoming' },
    pending:     { bg: 'bg-zinc-100',    text: 'text-zinc-700',    label: 'Pending' },
    in_progress: { bg: 'bg-amber-100',   text: 'text-amber-700',   label: 'In progress' },
    review:      { bg: 'bg-blue-100',    text: 'text-blue-700',    label: 'In review' },
    delivered:   { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Delivered' },
    delayed:     { bg: 'bg-red-100',     text: 'text-red-700',     label: 'Delayed' },
  },
  campaign: {
    draft:     { bg: 'bg-zinc-100',    text: 'text-zinc-700',    label: 'Draft' },
    active:    { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Active' },
    paused:    { bg: 'bg-amber-100',   text: 'text-amber-700',   label: 'Paused' },
    completed: { bg: 'bg-zinc-100',    text: 'text-zinc-600',    label: 'Completed' },
  },
}

// ─────────────────────────────────────────────────────────────────
// Campaign status → dot colour
// ─────────────────────────────────────────────────────────────────
export const CAMPAIGN_STATUS_DOT: Record<string, string> = {
  draft:     'bg-zinc-400',
  active:    'bg-emerald-500',
  paused:    'bg-amber-500',
  completed: 'bg-zinc-400',
}

// ─────────────────────────────────────────────────────────────────
// Activity type → Lucide icon + colour
// ─────────────────────────────────────────────────────────────────
export const ACTIVITY_TYPE_META: Record<
  string,
  { icon: LucideIcon; bg: string; text: string }
> = {
  content_published: { icon: FileVideo,   bg: 'bg-violet-100',  text: 'text-violet-600' },
  content_approved:  { icon: CheckCircle2, bg: 'bg-emerald-100', text: 'text-emerald-600' },
  content_rejected:  { icon: AlertTriangle,bg: 'bg-red-100',     text: 'text-red-600' },
  lead_received:     { icon: UserPlus,    bg: 'bg-blue-100',    text: 'text-blue-600' },
  campaign_started:  { icon: Megaphone,   bg: 'bg-orange-100',  text: 'text-orange-600' },
  campaign_completed:{ icon: TrendingUp,  bg: 'bg-emerald-100', text: 'text-emerald-600' },
  deliverable_due:   { icon: Calendar,    bg: 'bg-amber-100',   text: 'text-amber-600' },
  message_received:  { icon: MessageSquare,bg: 'bg-blue-100',    text: 'text-blue-600' },
  notification:      { icon: Bell,        bg: 'bg-zinc-100',    text: 'text-zinc-600' },
  default:           { icon: Sparkles,    bg: 'bg-zinc-100',    text: 'text-zinc-600' },
}

export function getActivityMeta(type: string) {
  return ACTIVITY_TYPE_META[type] ?? ACTIVITY_TYPE_META.default
}

// ─────────────────────────────────────────────────────────────────
// Notification type → Lucide icon
// ─────────────────────────────────────────────────────────────────
export const NOTIFICATION_TYPE_META: Record<
  string,
  { icon: LucideIcon; bg: string; text: string }
> = {
  alert:    { icon: AlertTriangle, bg: 'bg-red-100',     text: 'text-red-600' },
  info:     { icon: Bell,          bg: 'bg-blue-100',    text: 'text-blue-600' },
  success:  { icon: CheckCircle2,  bg: 'bg-emerald-100', text: 'text-emerald-600' },
  activity: { icon: Activity,      bg: 'bg-violet-100',  text: 'text-violet-600' },
  default:  { icon: Bell,          bg: 'bg-zinc-100',    text: 'text-zinc-600' },
}

export function getNotificationMeta(type: string) {
  return NOTIFICATION_TYPE_META[type] ?? NOTIFICATION_TYPE_META.default
}

// ─────────────────────────────────────────────────────────────────
// Metric key → human label
// ─────────────────────────────────────────────────────────────────
export const METRIC_KEY_LABELS: Record<string, string> = {
  instagram_followers: 'Instagram followers',
  reels_views:         'Reels views',
  leads_total:         'Total leads',
  orders_total:        'Total orders',
  website_visits:      'Website visits',
  aov_inr:             'Average order value',
  ad_spend_inr:        'Ad spend',
  roas:                'ROAS',
  email_open_rate:     'Email open rate',
  email_reply_rate:    'Email reply rate',
}

export function getMetricLabel(key: string): string {
  return METRIC_KEY_LABELS[key] ?? key.replace(/_/g, ' ')
}

// ─────────────────────────────────────────────────────────────────
// Campaign type labels
// ─────────────────────────────────────────────────────────────────
export const CAMPAIGN_TYPE_LABELS: Record<string, string> = {
  cold_email:         'Cold email',
  linkedin:           'LinkedIn',
  meta_ads:           'Meta ads',
  influencer_reel:    'Influencer reel',
  whatsapp_broadcast: 'WhatsApp',
}

export function getCampaignTypeLabel(type: string | null | undefined): string {
  if (!type) return '—'
  return CAMPAIGN_TYPE_LABELS[type] ?? type
}
