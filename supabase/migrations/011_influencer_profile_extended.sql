-- 011_influencer_profile_extended.sql
-- Extends influencer profiles, reels ordering, and enquiry request fields.

-- Influencer personal profile fields (admin-only: phone)
alter table influencers
  add column if not exists phone text,
  add column if not exists gender text,
  add column if not exists date_of_birth date,
  add column if not exists state text,
  add column if not exists cover_photo_url text,
  add column if not exists collaboration_types text[] not null default '{}',
  add column if not exists is_available boolean not null default true,
  add column if not exists preferred_campaign_types text[] not null default '{}',
  add column if not exists past_collaborations jsonb not null default '[]'::jsonb,
  add column if not exists profile_views integer not null default 0,
  add column if not exists platform_links jsonb not null default '{}'::jsonb,
  add column if not exists platform_follower_counts jsonb not null default '{}'::jsonb;

-- Reel display ordering
alter table influencer_reels
  add column if not exists display_order integer not null default 0;

create index if not exists influencer_reels_display_order_idx
  on influencer_reels(influencer_id, display_order asc);

-- Enquiry/campaign request fields on influencer_match_requests
alter table influencer_match_requests
  add column if not exists campaign_name text,
  add column if not exists campaign_start_date date,
  add column if not exists campaign_end_date date,
  add column if not exists deliverables text,
  add column if not exists budget_range text,
  add column if not exists requirements_notes text;
