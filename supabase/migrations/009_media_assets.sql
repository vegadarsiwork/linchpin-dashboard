-- Private app media asset metadata for UploadThing-hosted profile images,
-- trial reel previews, thumbnails, and lightweight portfolio media.

create table if not exists media_assets (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid references organisations(id) on delete cascade,
  influencer_id   uuid references influencers(id) on delete cascade,
  owner_user_id   uuid references users(id) on delete set null,
  created_by      uuid references users(id) on delete set null,
  bucket          text not null,
  object_key      text not null unique,
  filename        text not null,
  content_type    text not null,
  size_bytes      bigint not null default 0,
  asset_kind      text not null default 'misc',
  access_scope    text not null default 'private',
  status          text not null default 'pending_upload',
  checksum_sha256 text,
  metadata        jsonb not null default '{}'::jsonb,
  uploaded_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint media_assets_scope_check check (
    org_id is not null or influencer_id is not null or owner_user_id is not null
  ),
  constraint media_assets_status_check check (
    status in ('pending_upload', 'uploaded', 'failed', 'deleted')
  ),
  constraint media_assets_access_scope_check check (
    access_scope in ('private', 'client_visible', 'creator_visible', 'admin_only')
  ),
  constraint media_assets_asset_kind_check check (
    asset_kind in (
      'script',
      'script_version',
      'clip',
      'reel',
      'reel_version',
      'thumbnail',
      'portfolio',
      'influencer_reel',
      'attachment',
      'misc'
    )
  )
);

create index if not exists media_assets_org_id_idx on media_assets(org_id);
create index if not exists media_assets_influencer_id_idx on media_assets(influencer_id);
create index if not exists media_assets_owner_user_id_idx on media_assets(owner_user_id);
create index if not exists media_assets_kind_status_idx on media_assets(asset_kind, status);
create index if not exists media_assets_created_at_idx on media_assets(created_at desc);

alter table content_items
  add column if not exists media_asset_id uuid references media_assets(id) on delete set null,
  add column if not exists thumbnail_media_asset_id uuid references media_assets(id) on delete set null;

create index if not exists content_items_media_asset_id_idx
  on content_items(media_asset_id)
  where media_asset_id is not null;

alter table influencer_reels
  add column if not exists media_asset_id uuid references media_assets(id) on delete set null,
  add column if not exists thumbnail_media_asset_id uuid references media_assets(id) on delete set null;

create index if not exists influencer_reels_media_asset_id_idx
  on influencer_reels(media_asset_id)
  where media_asset_id is not null;
