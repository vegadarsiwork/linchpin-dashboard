-- 003_client_write_policies.sql
-- Allow clients to update rows in their own org for tables they interact with:
--   content_items (approve / request changes)
--   leads (status, follow-up bookkeeping)
--   activities (mark as read)
-- Superadmin-all policies from 002 are unchanged and continue to apply.

-- content_items: clients can UPDATE rows in own org
drop policy if exists content_items_client_update on content_items;
create policy content_items_client_update on content_items
  for update
  using (org_id = current_user_org_id())
  with check (org_id = current_user_org_id());

-- leads: clients can UPDATE rows in own org (status, follow-up, notes)
drop policy if exists leads_client_update on leads;
create policy leads_client_update on leads
  for update
  using (org_id = current_user_org_id())
  with check (org_id = current_user_org_id());

-- activities: clients can UPDATE rows in own org (mark is_read)
drop policy if exists activities_client_update on activities;
create policy activities_client_update on activities
  for update
  using (org_id = current_user_org_id())
  with check (org_id = current_user_org_id());

-- Notifications: clients can UPDATE own rows (already handled in 002 via
-- notifications_self_update). No-op here.
