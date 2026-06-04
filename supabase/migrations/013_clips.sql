-- 013_clips.sql
-- Clips: pre-reel approval module. Clients review clips before they go live.

create table if not exists clips (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null references organisations(id) on delete cascade,
  campaign_id       uuid references campaigns(id) on delete set null,
  title             text not null,
  duration_seconds  integer,
  preview_url       text,
  full_quality_url  text,
  status            text not null default 'pending'
                    check (status in ('pending', 'partially_reviewed', 'approved', 'changes_requested')),
  admin_notes       text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists clips_org_id_idx on clips(org_id);
create index if not exists clips_campaign_id_idx on clips(campaign_id) where campaign_id is not null;
create index if not exists clips_status_idx on clips(status);

-- Per-element approval matrix (one row per element type per clip)
create table if not exists clip_approval_elements (
  id            uuid primary key default gen_random_uuid(),
  clip_id       uuid not null references clips(id) on delete cascade,
  element_type  text not null
                check (element_type in ('background_location', 'voice_audio', 'influencer_presence')),
  status        text not null default 'pending'
                check (status in ('pending', 'approved', 'flagged')),
  comment       text,
  reviewed_by   uuid references users(id) on delete set null,
  reviewed_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (clip_id, element_type)
);

create index if not exists clip_approval_elements_clip_id_idx on clip_approval_elements(clip_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table clips enable row level security;
alter table clip_approval_elements enable row level security;

-- clips: org-scoped reads; superadmin writes all
drop policy if exists clips_select on clips;
create policy clips_select on clips
  for select using (is_superadmin() or org_id = current_user_org_id());

drop policy if exists clips_admin_all on clips;
create policy clips_admin_all on clips
  for all using (is_superadmin()) with check (is_superadmin());

-- clip_approval_elements: accessible if parent clip belongs to client org
drop policy if exists clip_approval_elements_select on clip_approval_elements;
create policy clip_approval_elements_select on clip_approval_elements
  for select using (
    is_superadmin()
    or exists (
      select 1 from clips c
      where c.id = clip_approval_elements.clip_id
        and c.org_id = current_user_org_id()
    )
  );

-- Clients may update their own clip elements (approve/flag individual elements)
drop policy if exists clip_approval_elements_client_update on clip_approval_elements;
create policy clip_approval_elements_client_update on clip_approval_elements
  for update
  using (
    exists (
      select 1 from clips c
      where c.id = clip_approval_elements.clip_id
        and c.org_id = current_user_org_id()
    )
  )
  with check (
    exists (
      select 1 from clips c
      where c.id = clip_approval_elements.clip_id
        and c.org_id = current_user_org_id()
    )
  );

drop policy if exists clip_approval_elements_admin_all on clip_approval_elements;
create policy clip_approval_elements_admin_all on clip_approval_elements
  for all using (is_superadmin()) with check (is_superadmin());
