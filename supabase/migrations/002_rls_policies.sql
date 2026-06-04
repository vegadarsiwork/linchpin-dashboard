-- 002_rls_policies.sql
-- Multi-tenant Row Level Security.
-- Pattern: clients see rows where org_id = their org. Superadmin sees everything.
-- influencers + influencer_campaigns: superadmin only (no client access).

-- ────────────────────────────────────────────────────────────────────
-- Helpers
-- ────────────────────────────────────────────────────────────────────
create or replace function is_superadmin() returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select role = 'superadmin' from public.users where id = auth.uid()), false);
$$;

create or replace function current_user_org_id() returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select org_id from public.users where id = auth.uid();
$$;

-- ────────────────────────────────────────────────────────────────────
-- Enable RLS
-- ────────────────────────────────────────────────────────────────────
alter table organisations              enable row level security;
alter table users                      enable row level security;
alter table metrics                    enable row level security;
alter table activities                 enable row level security;
alter table deliverables               enable row level security;
alter table content_items              enable row level security;
alter table leads                      enable row level security;
alter table campaigns                  enable row level security;
alter table notifications              enable row level security;
alter table scripts                    enable row level security;
alter table influencer_match_requests  enable row level security;
alter table influencers                enable row level security;
alter table influencer_campaigns       enable row level security;

-- ────────────────────────────────────────────────────────────────────
-- organisations
-- ────────────────────────────────────────────────────────────────────
drop policy if exists organisations_select on organisations;
create policy organisations_select on organisations
  for select using (is_superadmin() or id = current_user_org_id());

drop policy if exists organisations_admin_all on organisations;
create policy organisations_admin_all on organisations
  for all using (is_superadmin()) with check (is_superadmin());

-- ────────────────────────────────────────────────────────────────────
-- users
-- ────────────────────────────────────────────────────────────────────
drop policy if exists users_select on users;
create policy users_select on users
  for select using (
    is_superadmin()
    or id = auth.uid()
    or org_id = current_user_org_id()
  );

drop policy if exists users_self_update on users;
create policy users_self_update on users
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists users_admin_all on users;
create policy users_admin_all on users
  for all using (is_superadmin()) with check (is_superadmin());

-- ────────────────────────────────────────────────────────────────────
-- Macro: tenant tables (org_id-scoped, client read, superadmin all)
-- ────────────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  for t in select unnest(array[
    'metrics','activities','deliverables','content_items',
    'leads','campaigns','scripts','influencer_match_requests'
  ]) loop
    execute format('drop policy if exists %I_select on %I;', t, t);
    execute format(
      'create policy %I_select on %I
         for select using (is_superadmin() or org_id = current_user_org_id());',
      t, t
    );

    execute format('drop policy if exists %I_admin_all on %I;', t, t);
    execute format(
      'create policy %I_admin_all on %I
         for all using (is_superadmin()) with check (is_superadmin());',
      t, t
    );
  end loop;
end $$;

-- ────────────────────────────────────────────────────────────────────
-- notifications: scope by user_id OR org_id
-- ────────────────────────────────────────────────────────────────────
drop policy if exists notifications_select on notifications;
create policy notifications_select on notifications
  for select using (
    is_superadmin()
    or user_id = auth.uid()
    or org_id = current_user_org_id()
  );

drop policy if exists notifications_self_update on notifications;
create policy notifications_self_update on notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists notifications_admin_all on notifications;
create policy notifications_admin_all on notifications
  for all using (is_superadmin()) with check (is_superadmin());

-- ────────────────────────────────────────────────────────────────────
-- influencers + influencer_campaigns: SUPERADMIN ONLY
-- ────────────────────────────────────────────────────────────────────
drop policy if exists influencers_admin_all on influencers;
create policy influencers_admin_all on influencers
  for all using (is_superadmin()) with check (is_superadmin());

drop policy if exists influencer_campaigns_admin_all on influencer_campaigns;
create policy influencer_campaigns_admin_all on influencer_campaigns
  for all using (is_superadmin()) with check (is_superadmin());
