-- 001_initial_schema.sql
-- Linchpin Studio initial schema: organisations, users, metrics, activities,
-- deliverables, content_items, leads, campaigns, notifications, influencers,
-- influencer_campaigns, scripts, influencer_match_requests.

create extension if not exists "pgcrypto";

-- ────────────────────────────────────────────────────────────────────
-- organisations
-- ────────────────────────────────────────────────────────────────────
create table if not exists organisations (
  id                          uuid primary key default gen_random_uuid(),
  name                        text not null,
  slug                        text unique not null,
  logo_url                    text,
  plan                        text default 'starter',
  status                      text default 'active',
  active_modules              text[] default '{}',
  zap_enabled                 boolean default false,
  zap_org_id                  text,
  web_enabled                 boolean default false,
  account_manager_name        text,
  account_manager_email       text,
  account_manager_phone       text,
  account_manager_avatar_url  text,
  billing_cycle_start         date,
  brand_category              text,
  brand_description           text,
  target_audience             text,
  brand_tone                  text,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────────────
-- users (mirror profile of auth.users)
-- ────────────────────────────────────────────────────────────────────
create table if not exists users (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text unique not null,
  full_name     text,
  avatar_url    text,
  phone         text,
  role          text not null default 'client' check (role in ('superadmin','client')),
  org_id        uuid references organisations(id) on delete set null,
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz
);
create index if not exists users_org_id_idx on users(org_id);

-- ────────────────────────────────────────────────────────────────────
-- metrics
-- ────────────────────────────────────────────────────────────────────
create table if not exists metrics (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references organisations(id) on delete cascade,
  metric_key     text not null,
  metric_value   numeric,
  metric_change  numeric,
  period         text not null,
  source         text,
  updated_at     timestamptz not null default now(),
  unique (org_id, metric_key, period)
);
create index if not exists metrics_org_id_idx on metrics(org_id);

-- ────────────────────────────────────────────────────────────────────
-- activities
-- ────────────────────────────────────────────────────────────────────
create table if not exists activities (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references organisations(id) on delete cascade,
  type         text not null,
  title        text not null,
  description  text,
  link         text,
  metadata     jsonb not null default '{}'::jsonb,
  is_read      boolean not null default false,
  created_at   timestamptz not null default now()
);
create index if not exists activities_org_id_idx on activities(org_id);
create index if not exists activities_created_idx on activities(created_at desc);

-- ────────────────────────────────────────────────────────────────────
-- deliverables
-- ────────────────────────────────────────────────────────────────────
create table if not exists deliverables (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organisations(id) on delete cascade,
  title         text not null,
  description   text,
  module        text,
  status        text not null default 'pending',
  due_date      date,
  delivered_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists deliverables_org_id_idx on deliverables(org_id);

-- ────────────────────────────────────────────────────────────────────
-- influencers (defined before tables that FK to it)
-- ────────────────────────────────────────────────────────────────────
create table if not exists influencers (
  id                      uuid primary key default gen_random_uuid(),
  name                    text not null,
  handle                  text,
  platform                text,
  profile_url             text,
  avatar_url              text,
  city                    text,
  audience_regions        text[] default '{}',
  languages               text[] default '{}',
  niches                  text[] default '{}',
  content_styles          text[] default '{}',
  follower_count          integer,
  engagement_rate         numeric,
  audience_notes          text,
  rate_per_reel           numeric,
  rate_per_story          numeric,
  availability            text,
  linchpin_rating         integer check (linchpin_rating between 1 and 5),
  past_brand_categories   text[] default '{}',
  avoid_categories        text[] default '{}',
  competitor_brands       text[] default '{}',
  notes                   text,
  active                  boolean not null default true,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
create index if not exists influencers_active_idx on influencers(active);

-- ────────────────────────────────────────────────────────────────────
-- scripts
-- ────────────────────────────────────────────────────────────────────
create table if not exists scripts (
  id                   uuid primary key default gen_random_uuid(),
  org_id               uuid not null references organisations(id) on delete cascade,
  title                text not null,
  brief                jsonb not null default '{}'::jsonb,
  variations           jsonb not null default '[]'::jsonb,
  selected_variation   integer not null default 0,
  status               text not null default 'draft',
  influencer_id        uuid references influencers(id) on delete set null,
  created_by           uuid references users(id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists scripts_org_id_idx on scripts(org_id);

-- ────────────────────────────────────────────────────────────────────
-- content_items
-- ────────────────────────────────────────────────────────────────────
create table if not exists content_items (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references organisations(id) on delete cascade,
  title            text not null,
  type             text,
  status           text not null default 'draft',
  caption          text,
  hashtags         text[] default '{}',
  asset_url        text,
  asset_type       text,
  asset_size_mb    numeric,
  scheduled_for    timestamptz,
  published_at     timestamptz,
  platform         text,
  client_feedback  text,
  script_id        uuid references scripts(id) on delete set null,
  influencer_id    uuid references influencers(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists content_items_org_id_idx on content_items(org_id);
create index if not exists content_items_status_idx on content_items(status);

-- ────────────────────────────────────────────────────────────────────
-- leads
-- ────────────────────────────────────────────────────────────────────
create table if not exists leads (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references organisations(id) on delete cascade,
  name            text,
  phone           text,
  email           text,
  source          text,
  source_detail   text,
  status          text not null default 'new',
  notes           text,
  follow_up_at    timestamptz,
  follow_up_note  text,
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists leads_org_id_idx on leads(org_id);

-- ────────────────────────────────────────────────────────────────────
-- campaigns
-- ────────────────────────────────────────────────────────────────────
create table if not exists campaigns (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organisations(id) on delete cascade,
  name        text not null,
  type        text,
  status      text not null default 'draft',
  stats       jsonb not null default '{}'::jsonb,
  started_at  timestamptz,
  ended_at    timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists campaigns_org_id_idx on campaigns(org_id);

-- ────────────────────────────────────────────────────────────────────
-- notifications
-- ────────────────────────────────────────────────────────────────────
create table if not exists notifications (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid references organisations(id) on delete cascade,
  user_id         uuid references users(id) on delete cascade,
  type            text not null,
  title           text not null,
  body            text,
  link            text,
  channels        text[] default '{}',
  sent_email      boolean not null default false,
  sent_whatsapp   boolean not null default false,
  is_read         boolean not null default false,
  created_at      timestamptz not null default now()
);
create index if not exists notifications_org_id_idx on notifications(org_id);
create index if not exists notifications_user_id_idx on notifications(user_id);

-- ────────────────────────────────────────────────────────────────────
-- influencer_campaigns (performance log per influencer x campaign)
-- ────────────────────────────────────────────────────────────────────
create table if not exists influencer_campaigns (
  id                   uuid primary key default gen_random_uuid(),
  influencer_id        uuid not null references influencers(id) on delete cascade,
  org_id               uuid references organisations(id) on delete set null,
  brand_category       text,
  campaign_goal        text,
  content_style_used   text,
  platform             text,
  views                integer default 0,
  likes                integer default 0,
  comments             integer default 0,
  shares               integer default 0,
  saves                integer default 0,
  reach                integer default 0,
  leads_generated      integer default 0,
  engagement_rate      numeric,
  team_rating          integer check (team_rating between 1 and 5),
  client_rating        integer check (client_rating between 1 and 5),
  notes                text,
  went_live_at         timestamptz,
  script_id            uuid references scripts(id) on delete set null,
  created_at           timestamptz not null default now()
);
create index if not exists influencer_campaigns_inf_idx on influencer_campaigns(influencer_id);
create index if not exists influencer_campaigns_org_idx on influencer_campaigns(org_id);

-- ────────────────────────────────────────────────────────────────────
-- influencer_match_requests
-- ────────────────────────────────────────────────────────────────────
create table if not exists influencer_match_requests (
  id                       uuid primary key default gen_random_uuid(),
  org_id                   uuid not null references organisations(id) on delete cascade,
  brief                    jsonb not null default '{}'::jsonb,
  matches                  jsonb not null default '[]'::jsonb,
  selected_influencer_id   uuid references influencers(id) on delete set null,
  created_by               uuid references users(id) on delete set null,
  created_at               timestamptz not null default now()
);
create index if not exists imr_org_idx on influencer_match_requests(org_id);

-- ────────────────────────────────────────────────────────────────────
-- updated_at trigger
-- ────────────────────────────────────────────────────────────────────
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  for t in select unnest(array[
    'organisations','deliverables','content_items','leads',
    'campaigns','influencers','scripts'
  ]) loop
    execute format(
      'drop trigger if exists %I_set_updated_at on %I;
       create trigger %I_set_updated_at before update on %I
       for each row execute function set_updated_at();',
      t, t, t, t
    );
  end loop;
end $$;
