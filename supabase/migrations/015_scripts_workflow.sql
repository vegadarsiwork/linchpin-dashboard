-- 015_scripts_workflow.sql
-- Extends scripts table with campaign linkage and body text.
-- Adds script_versions (revision history) and script_comments (client inline feedback).

-- ---------------------------------------------------------------------------
-- Extend scripts
-- ---------------------------------------------------------------------------
alter table scripts
  add column if not exists campaign_id uuid references campaigns(id) on delete set null,
  add column if not exists body text;

create index if not exists scripts_campaign_id_idx on scripts(campaign_id);

-- ---------------------------------------------------------------------------
-- script_versions: each manual revision created by admin
-- ---------------------------------------------------------------------------
create table if not exists script_versions (
  id              uuid primary key default gen_random_uuid(),
  script_id       uuid not null references scripts(id) on delete cascade,
  version_number  integer not null,
  body            text not null,
  note            text,
  created_by      uuid references users(id) on delete set null,
  created_at      timestamptz not null default now(),
  unique (script_id, version_number)
);
create index if not exists script_versions_script_id_idx on script_versions(script_id);

-- ---------------------------------------------------------------------------
-- script_comments: paragraph-level client feedback
-- ---------------------------------------------------------------------------
create table if not exists script_comments (
  id               uuid primary key default gen_random_uuid(),
  script_id        uuid not null references scripts(id) on delete cascade,
  user_id          uuid references users(id) on delete set null,
  paragraph_index  integer,
  selected_text    text,
  comment          text not null,
  resolved         boolean not null default false,
  created_at       timestamptz not null default now()
);
create index if not exists script_comments_script_id_idx on script_comments(script_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table script_versions enable row level security;
alter table script_comments enable row level security;

-- script_versions: readable if parent script belongs to client org
drop policy if exists script_versions_select on script_versions;
create policy script_versions_select on script_versions
  for select using (
    is_superadmin()
    or exists (
      select 1 from scripts s
      where s.id = script_versions.script_id
        and s.org_id = current_user_org_id()
    )
  );

drop policy if exists script_versions_admin_all on script_versions;
create policy script_versions_admin_all on script_versions
  for all using (is_superadmin()) with check (is_superadmin());

-- script_comments: readable if parent script belongs to client org
drop policy if exists script_comments_select on script_comments;
create policy script_comments_select on script_comments
  for select using (
    is_superadmin()
    or exists (
      select 1 from scripts s
      where s.id = script_comments.script_id
        and s.org_id = current_user_org_id()
    )
  );

-- Clients may insert comments on their own org's scripts
drop policy if exists script_comments_insert on script_comments;
create policy script_comments_insert on script_comments
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from scripts s
      where s.id = script_comments.script_id
        and s.org_id = current_user_org_id()
    )
  );

drop policy if exists script_comments_admin_all on script_comments;
create policy script_comments_admin_all on script_comments
  for all using (is_superadmin()) with check (is_superadmin());
