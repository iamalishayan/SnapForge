-- SnapForge Database Schema — run in Supabase SQL Editor in order
-- Tables: templates, articles, site_configs, translations, qa_queue, publish_log, keywords, cost_log

-- templates table — stores reusable content templates with SEO meta and AI prompt config
create table templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category text,
  gemini_prompt text,
  preview_image_url text,
  meta_title text,
  meta_description text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

-- articles table — English source content linked to a template, drives all translations
create table articles (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references templates(id) on delete cascade,
  title text not null,
  content text not null,
  meta_title text,
  meta_description text,
  og_image_url text,
  inner_links jsonb default '[]',
  outer_links jsonb default '[]',
  status text default 'draft'
    check (status in ('draft','staging','qa_queue','published')),
  priority text default 'normal'
    check (priority in ('high','normal','low')),
  scheduled_at timestamptz,
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

-- site_configs table — one row per target domain with language, country, theme, monetization config
create table site_configs (
  id uuid primary key default gen_random_uuid(),
  domain text not null unique,
  language_code text not null,
  country_code text not null,
  theme_name text default 'theme_a',
  adsense_publisher_id text,
  adsense_slot_id text,
  monetization_type text default 'adsense'
    check (monetization_type in ('adsense','affiliate','own_service','mixed')),
  indexnow_key text,
  sitemap_url text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- translations table — AI-translated content per article × site, goes through staging → qa_approved → published
create table translations (
  id uuid primary key default gen_random_uuid(),
  article_id uuid references articles(id) on delete cascade,
  site_config_id uuid references site_configs(id) on delete cascade,
  language_code text not null,
  country_code text not null,
  translated_title text,
  translated_content text,
  translated_meta_title text,
  translated_meta_description text,
  translated_faq jsonb default '[]',
  target_keywords jsonb default '[]',
  inner_links jsonb default '[]',
  outer_links jsonb default '[]',
  status text default 'staging'
    check (status in ('staging','qa_queue','qa_approved','published','flagged')),
  qa_auto_passed boolean,
  qa_auto_errors jsonb default '[]',
  qa_auto_warnings jsonb default '[]',  -- soft warnings that don't block QA (e.g. word count ratio)
  qa_human_reviewed boolean default false,
  qa_reviewer_notes text,
  token_count integer,
  model_used text,
  version integer default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  unique(article_id, site_config_id)
);

-- qa_queue table — tracks human review assignments and decisions for each translation
create table qa_queue (
  id uuid primary key default gen_random_uuid(),
  translation_id uuid references translations(id) on delete cascade,
  priority text default 'normal'
    check (priority in ('high','normal','low')),
  assigned_to text,
  status text default 'pending'
    check (status in ('pending','in_review','approved','flagged','skipped')),
  flagged_reason text,
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

-- publish_log table — immutable audit log of every publish/unpublish/revalidate action
create table publish_log (
  id uuid primary key default gen_random_uuid(),
  translation_id uuid references translations(id),
  site_config_id uuid references site_configs(id),
  action text not null
    check (action in ('published','unpublished','revalidated','flagged')),
  indexnow_pinged boolean default false,
  indexnow_response jsonb,
  vercel_revalidation_triggered boolean default false,
  page_url text,
  created_at timestamptz default now()
);

-- keywords table — local SEO keyword config per template × language for AI prompt injection
create table keywords (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references templates(id) on delete cascade,
  language_code text not null,
  country_code text not null,
  primary_keyword text not null,
  secondary_keywords jsonb default '[]',
  search_volume integer,
  source text,
  created_at timestamptz default now(),
  unique(template_id, language_code)
);

-- cost_log table — per-translation token usage and estimated USD cost for budget tracking
create table cost_log (
  id uuid primary key default gen_random_uuid(),
  translation_id uuid references translations(id),
  model text not null,
  input_tokens integer,
  output_tokens integer,
  estimated_cost_usd numeric(10,6),
  created_at timestamptz default now()
);

-- Indexes
create index idx_templates_slug on templates(slug);
create index idx_articles_template_id on articles(template_id);
create index idx_articles_status on articles(status);
create index idx_translations_article_site on translations(article_id, site_config_id);
create index idx_translations_status on translations(status);
create index idx_translations_language on translations(language_code);

-- RLS policies
alter table templates enable row level security;
alter table articles enable row level security;
alter table translations enable row level security;
alter table site_configs enable row level security;
alter table qa_queue enable row level security;
alter table publish_log enable row level security;

create policy "Public read published translations" on translations for select using (status = 'published' and deleted_at is null);
create policy "Public read site configs" on site_configs for select using (active = true);
create policy "Public read templates" on templates for select using (active = true and deleted_at is null);

-- indexing_stats table — tracks Google Search Console performance per site per day
create table indexing_stats (
  id uuid primary key default gen_random_uuid(),
  site_config_id uuid references site_configs(id) on delete cascade,
  date date not null,
  total_clicks integer default 0,
  total_impressions integer default 0,
  avg_ctr numeric(5,4) default 0,
  avg_position numeric(6,2) default 0,
  created_at timestamptz default now(),
  unique(site_config_id, date)
);


-- api_keys table — tracks scoped API keys for admin authentication
create table api_keys (
  id uuid primary key default gen_random_uuid(),
  key_hash text not null unique,
  name text not null,
  scope text not null check (scope in ('read', 'write', 'admin', 'cron', 'webhook')),
  owner text,
  active boolean default true,
  last_used_at timestamptz,
  created_at timestamptz default now()
);

alter table api_keys enable row level security;
-- Service role only, no public policies
