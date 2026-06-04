-- 012_extend_campaigns.sql
-- Extend campaigns with production workflow fields: brief, notes, created_by.
-- Does not rename or drop existing columns.

alter table campaigns
  add column if not exists brief      text,
  add column if not exists notes      text,
  add column if not exists created_by uuid references users(id) on delete set null;

create index if not exists campaigns_created_by_idx on campaigns(created_by);
create index if not exists campaigns_status_org_idx on campaigns(org_id, status);
