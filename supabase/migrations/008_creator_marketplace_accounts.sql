-- 008_creator_marketplace_accounts.sql
-- Two-sided creator marketplace: influencer-owned profiles, moderated reels,
-- and request history while Linchpin remains the intermediary.

alter table users
  drop constraint if exists users_role_check;

alter table users
  add constraint users_role_check
  check (role in ('superadmin','client','influencer'));

alter table influencers
  add column if not exists user_id uuid references users(id) on delete set null,
  add column if not exists slug text,
  add column if not exists display_name text,
  add column if not exists approval_status text not null default 'approved',
  add column if not exists public_profile_completed boolean not null default false,
  add column if not exists profile_submitted_at timestamptz,
  add column if not exists approved_at timestamptz,
  add column if not exists rejected_at timestamptz,
  add column if not exists rejection_reason text;

create unique index if not exists influencers_user_id_unique
  on influencers(user_id)
  where user_id is not null;

create unique index if not exists influencers_slug_unique
  on influencers(slug)
  where slug is not null;

create index if not exists influencers_approval_status_idx
  on influencers(approval_status);

update influencers
   set display_name = coalesce(display_name, name),
       slug = coalesce(slug, lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))),
       approval_status = coalesce(approval_status, 'approved'),
       approved_at = coalesce(approved_at, now()),
       public_profile_completed = true
 where user_id is null;

create table if not exists influencer_reels (
  id               uuid primary key default gen_random_uuid(),
  influencer_id    uuid not null references influencers(id) on delete cascade,
  title            text not null,
  gif_url          text,
  video_url        text,
  thumbnail_url    text,
  source_url       text,
  category_tags    text[] not null default '{}',
  is_featured      boolean not null default false,
  approval_status  text not null default 'pending_review',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists influencer_reels_influencer_idx
  on influencer_reels(influencer_id);

create index if not exists influencer_reels_approval_idx
  on influencer_reels(approval_status);

drop trigger if exists influencer_reels_set_updated_at on influencer_reels;
create trigger influencer_reels_set_updated_at
  before update on influencer_reels
  for each row execute function set_updated_at();

create table if not exists influencer_request_events (
  id             uuid primary key default gen_random_uuid(),
  request_id     uuid not null references influencer_match_requests(id) on delete cascade,
  actor_user_id  uuid references users(id) on delete set null,
  event_type     text not null,
  note           text,
  created_at     timestamptz not null default now()
);

create index if not exists influencer_request_events_request_idx
  on influencer_request_events(request_id, created_at desc);
