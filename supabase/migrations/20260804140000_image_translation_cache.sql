-- Image localization: VLM/render cache + public storage bucket for rendered PNGs

create table if not exists image_translation_cache (
  id uuid primary key default gen_random_uuid(),
  image_hash text not null,
  target_locale text not null,
  classification jsonb,
  translated_slots jsonb,
  rendered_url text,
  created_at timestamptz default now(),
  unique (image_hash, target_locale)
);

create index if not exists idx_image_cache_hash_locale
  on image_translation_cache (image_hash, target_locale);

alter table image_translation_cache enable row level security;

grant select, insert, update, delete on image_translation_cache to service_role;

-- Note: the public "images" storage bucket is created via the Storage API
-- (scripts/setup-image-bucket.ts), not SQL, since storage.buckets is managed.
