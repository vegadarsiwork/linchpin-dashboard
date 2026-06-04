-- 007_influencer_marketplace.sql
-- Client-facing influencer marketplace fields and managed request workflow.

alter table influencers
  add column if not exists public_visible boolean not null default false,
  add column if not exists public_bio text,
  add column if not exists price_range_min_inr numeric,
  add column if not exists price_range_max_inr numeric,
  add column if not exists sample_content_urls text[] not null default '{}',
  add column if not exists average_reel_views integer,
  add column if not exists audience_age_range text,
  add column if not exists audience_gender_skew text;

alter table influencer_match_requests
  add column if not exists status text not null default 'requested',
  add column if not exists requested_influencer_id uuid references influencers(id) on delete set null,
  add column if not exists request_source text not null default 'match',
  add column if not exists client_notes text,
  add column if not exists admin_notes text,
  add column if not exists confirmed_at timestamptz,
  add column if not exists declined_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists influencers_public_visible_idx
  on influencers(public_visible)
  where active = true;

create index if not exists imr_status_idx
  on influencer_match_requests(status);

create index if not exists imr_requested_influencer_idx
  on influencer_match_requests(requested_influencer_id);

drop trigger if exists influencer_match_requests_set_updated_at on influencer_match_requests;
create trigger influencer_match_requests_set_updated_at
  before update on influencer_match_requests
  for each row execute function set_updated_at();
