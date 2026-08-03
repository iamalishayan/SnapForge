-- Drop existing keywords table
DROP TABLE IF EXISTS keywords;

-- Recreate keywords table linked to article_id instead of template_id
create table keywords (
  id uuid primary key default gen_random_uuid(),
  article_id uuid references articles(id) on delete cascade not null,
  language_code text not null,
  country_code text not null,
  primary_keyword text not null,
  secondary_keywords jsonb default '[]',
  search_volume integer,
  source text,
  created_at timestamptz default now(),
  unique(article_id, language_code)
);
