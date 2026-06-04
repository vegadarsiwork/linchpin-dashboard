-- 014_reel_delivery_workflow.sql
-- Adds version history, corrections, and download events for the reel delivery workflow.
-- New statuses (text, no constraint): correction_requested, correction_submitted,
-- revised, final_approved  (existing: pending_approval, approved, rejected remain)

-- ---------------------------------------------------------------------------
-- content_item_versions: one row per admin-uploaded version of a reel
-- ---------------------------------------------------------------------------
create table if not exists content_item_versions (
  id               uuid primary key default gen_random_uuid(),
  content_item_id  uuid not null references content_items(id) on delete cascade,
  org_id           uuid not null references organisations(id) on delete cascade,
  version_number   integer not null,
  asset_url        text,
  full_quality_url text,
  label            text,
  uploaded_by      uuid references users(id) on delete set null,
  created_at       timestamptz not null default now()
);
create index if not exists civ_content_item_id_idx
  on content_item_versions(content_item_id);
create unique index if not exists civ_unique_version
  on content_item_versions(content_item_id, version_number);

-- ---------------------------------------------------------------------------
-- reel_corrections: correction notes submitted by clients
-- ---------------------------------------------------------------------------
create table if not exists reel_corrections (
  id               uuid primary key default gen_random_uuid(),
  content_item_id  uuid not null references content_items(id) on delete cascade,
  org_id           uuid not null references organisations(id) on delete cascade,
  user_id          uuid references users(id) on delete set null,
  note             text not null,
  version_number   integer,
  created_at       timestamptz not null default now()
);
create index if not exists rc_content_item_id_idx
  on reel_corrections(content_item_id);

-- ---------------------------------------------------------------------------
-- reel_download_events: log every download by user
-- ---------------------------------------------------------------------------
create table if not exists reel_download_events (
  id               uuid primary key default gen_random_uuid(),
  content_item_id  uuid not null references content_items(id) on delete cascade,
  org_id           uuid not null references organisations(id) on delete cascade,
  user_id          uuid references users(id) on delete set null,
  version_id       uuid references content_item_versions(id) on delete set null,
  downloaded_at    timestamptz not null default now()
);
create index if not exists rde_content_item_id_idx
  on reel_download_events(content_item_id);
create index if not exists rde_user_id_idx
  on reel_download_events(user_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table content_item_versions enable row level security;
alter table reel_corrections enable row level security;
alter table reel_download_events enable row level security;

-- content_item_versions: org-scoped reads; superadmin writes all
drop policy if exists content_item_versions_select on content_item_versions;
create policy content_item_versions_select on content_item_versions
  for select using (is_superadmin() or org_id = current_user_org_id());

drop policy if exists content_item_versions_admin_all on content_item_versions;
create policy content_item_versions_admin_all on content_item_versions
  for all using (is_superadmin()) with check (is_superadmin());

-- reel_corrections: clients can read and insert for their own org
drop policy if exists reel_corrections_select on reel_corrections;
create policy reel_corrections_select on reel_corrections
  for select using (is_superadmin() or org_id = current_user_org_id());

drop policy if exists reel_corrections_client_insert on reel_corrections;
create policy reel_corrections_client_insert on reel_corrections
  for insert with check (
    user_id = auth.uid()
    and org_id = current_user_org_id()
  );

drop policy if exists reel_corrections_admin_all on reel_corrections;
create policy reel_corrections_admin_all on reel_corrections
  for all using (is_superadmin()) with check (is_superadmin());

-- reel_download_events: clients can read and insert for their own org
drop policy if exists reel_download_events_select on reel_download_events;
create policy reel_download_events_select on reel_download_events
  for select using (is_superadmin() or org_id = current_user_org_id());

drop policy if exists reel_download_events_client_insert on reel_download_events;
create policy reel_download_events_client_insert on reel_download_events
  for insert with check (
    user_id = auth.uid()
    and org_id = current_user_org_id()
  );

drop policy if exists reel_download_events_admin_all on reel_download_events;
create policy reel_download_events_admin_all on reel_download_events
  for all using (is_superadmin()) with check (is_superadmin());
