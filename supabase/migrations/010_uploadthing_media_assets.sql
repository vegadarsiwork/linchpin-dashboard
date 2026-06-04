-- UploadThing-backed app media. Large full-quality reel originals are expected
-- to be shared as external Drive-style links, not stored in app storage.

alter table media_assets
  add column if not exists provider text not null default 'uploadthing',
  add column if not exists provider_file_key text,
  add column if not exists url text;

create index if not exists media_assets_provider_file_key_idx
  on media_assets(provider, provider_file_key)
  where provider_file_key is not null;

alter table content_items
  add column if not exists full_quality_url text;
