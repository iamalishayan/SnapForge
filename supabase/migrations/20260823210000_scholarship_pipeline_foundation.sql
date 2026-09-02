-- SnapForge — Scholarship Pipeline Foundation (Phase 0, v5)
-- Creates all scholarship-domain tables.
-- Fully additive — does NOT touch any existing SnapForge tables.
--
-- Tables created (dependency order):
--   1. scholarship_records         — one row per unique scholarship (stable across cycles)
--   2. scholarship_intakes         — relational intakes; UNIQUE(scholarship_id, intake_key)
--                                    eliminates the JSONB race condition (v5 fix)
--   3. scholarship_article_clusters— top-level cluster entity (1:1 with scholarship_record)
--   4. scholarship_article_variants— one row per published locale/domain variant (relational, v5 Q3 decision)
--   5. scholarship_cluster_jobs    — atomic cluster publish job state + per-domain revalidation tracking
--   6. scholarship_fetch_log       — append-only fetch audit log
--   7. scholarship_quarantine      — quarantined records + reviewer action trail


-- ─── 1. scholarship_records ──────────────────────────────────────────────────
-- One row per unique scholarship. Stable across intake cycles — no year in the
-- identity hash. `id` is computed as SHA-256(provider || slug || country) in
-- the application layer (hashUtils.computeScholarshipId) so upserts are idempotent.

CREATE TABLE scholarship_records (
  -- Identity
  id                     TEXT PRIMARY KEY,  -- SHA-256(provider + slug + country) — deterministic, no UUID
  name                   TEXT NOT NULL,
  slug                   TEXT NOT NULL,     -- URL-safe ASCII, established at first publish, never changes
  provider               TEXT NOT NULL,
  provider_type          TEXT NOT NULL
    CHECK (provider_type IN ('government', 'university', 'foundation', 'eu_body', 'aggregator')),

  -- Geographic / academic scope
  country                TEXT NOT NULL,     -- ISO 3166-1 alpha-2 (e.g. 'DE')
  target_degree          TEXT NOT NULL
    CHECK (target_degree IN ('ms', 'phd', 'bachelor', 'postdoc', 'any')),
  disciplines            TEXT[]  NOT NULL DEFAULT '{}',  -- e.g. '{engineering,computer_science}'
  nationality            TEXT[]  NOT NULL DEFAULT '{}',  -- empty = open to all nationalities

  -- Financial
  monthly_stipend_amount       NUMERIC(10,2),
  monthly_stipend_min_amount   NUMERIC(10,2),
  monthly_stipend_max_amount   NUMERIC(10,2),
  monthly_stipend_currency     TEXT    DEFAULT 'EUR'
    CHECK (monthly_stipend_currency = 'EUR'),  -- pilot scope: EUR only
  tuition_coverage             BOOLEAN,
  health_insurance_covered     BOOLEAN,
  other_benefits               TEXT[]  DEFAULT '{}',
  funding_type                 TEXT
    CHECK (funding_type IN ('full', 'partial', 'tuition_only', 'stipend_only', 'travel_grant', 'unknown')),

  -- Cycle lifecycle
  cycle_status               TEXT    NOT NULL DEFAULT 'active'
    CHECK (cycle_status IN ('active', 'expired', 'awaiting_next_cycle', 'discontinued')),
  active_intake_id           UUID,           -- FK → scholarship_intakes.id (set after intake created)
  max_cycle_wait_days        INTEGER NOT NULL DEFAULT 365,
  awaiting_next_cycle_since  TIMESTAMPTZ,

  -- Provenance
  source_url             TEXT    NOT NULL,
  official_apply_url     TEXT    NOT NULL,
  source_tier            INTEGER NOT NULL
    CHECK (source_tier IN (1, 2, 3)),
  source_language        TEXT    NOT NULL DEFAULT 'en', -- BCP 47 (e.g. 'de', 'en')
  fetched_at             TIMESTAMPTZ,
  last_verified_at       TIMESTAMPTZ,

  -- Two-stage hashing (Phase 2.4 + 3.4)
  clean_content_hash     TEXT,   -- SHA-256 of sanitized page text (Stage 1 diff)
  semantic_record_hash   TEXT,   -- computeSemanticRecordHash() output (Stage 2 diff)

  -- Content
  short_description      TEXT,
  eligibility_summary    JSONB   NOT NULL DEFAULT '[]',  -- EligibilityItem[]
  required_documents     TEXT[]  NOT NULL DEFAULT '{}',
  language_requirements  JSONB   NOT NULL DEFAULT '[]',  -- LanguageRequirement[]

  -- Pipeline linkback
  article_id             UUID    REFERENCES articles(id) ON DELETE SET NULL,
  article_generated      BOOLEAN NOT NULL DEFAULT false,
  quarantine_reason      TEXT,

  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enforce that active_intake_id, when set, references scholarship_intakes.
-- FK is deferred because scholarship_intakes references scholarship_records first.
-- We add this constraint after scholarship_intakes is created (below).

COMMENT ON TABLE scholarship_records IS
  'One row per unique scholarship program. Stable across intake cycles. '
  'id = SHA-256(provider || slug || country) computed in application layer.';

COMMENT ON COLUMN scholarship_records.clean_content_hash IS
  'SHA-256 of sanitized main-content page text. Stage 1 diff — detects any page change.';

COMMENT ON COLUMN scholarship_records.semantic_record_hash IS
  'computeSemanticRecordHash() output. Stage 2 diff — detects scholarship data changes only. '
  'Downstream rebuild fires only when this changes.';

COMMENT ON COLUMN scholarship_records.active_intake_id IS
  'FK to scholarship_intakes.id — points to current or most-recent intake. '
  'Null until first intake is upserted.';


-- ─── 2. scholarship_intakes ──────────────────────────────────────────────────
-- Dedicated relational table for intake cycles. UNIQUE(scholarship_id, intake_key)
-- is the entire fix for the JSONB race condition from v4:
--   INSERT ... ON CONFLICT (scholarship_id, intake_key) DO UPDATE SET ...
-- executes atomically — no application-level read-modify-write, no lost updates.

CREATE TABLE scholarship_intakes (
  id                 UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  scholarship_id     TEXT    NOT NULL REFERENCES scholarship_records(id) ON DELETE CASCADE,

  -- intake_key = SHA-256(semester || cycle_label) — immutable per cycle
  intake_key         TEXT    NOT NULL,

  semester           TEXT    NOT NULL
    CHECK (semester IN ('Wintersemester', 'Sommersemester', 'Annual', 'Rolling')),
  cycle_label        TEXT    NOT NULL,   -- e.g. '2026/27'

  -- Dates stored as DATE, always interpreted in Europe/Berlin timezone by the application
  deadline           DATE    NOT NULL,
  program_start_date DATE,

  -- Amendment tracking
  last_amended_at    TIMESTAMPTZ,
  amendment_count    INTEGER NOT NULL DEFAULT 0,

  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- THE CRITICAL CONSTRAINT — atomic upsert guarantee
  CONSTRAINT uq_scholarship_intake UNIQUE (scholarship_id, intake_key)
);

CREATE INDEX idx_scholarship_intakes_scholarship_id
  ON scholarship_intakes(scholarship_id);

CREATE INDEX idx_scholarship_intakes_deadline
  ON scholarship_intakes(deadline);

COMMENT ON TABLE scholarship_intakes IS
  'Relational intake cycles for scholarship_records. '
  'UNIQUE(scholarship_id, intake_key) enables atomic ON CONFLICT DO UPDATE upserts '
  'eliminating the JSONB race condition from v4.';

COMMENT ON CONSTRAINT uq_scholarship_intake ON scholarship_intakes IS
  'Atomic uniqueness enforced by PostgreSQL engine. Two concurrent workers can safely '
  'INSERT ... ON CONFLICT DO UPDATE without application-level locking.';

-- Now that scholarship_intakes exists, add the deferred FK from scholarship_records
ALTER TABLE scholarship_records
  ADD CONSTRAINT fk_active_intake
    FOREIGN KEY (active_intake_id)
    REFERENCES scholarship_intakes(id)
    ON DELETE SET NULL
    DEFERRABLE INITIALLY DEFERRED;


-- ─── 3. scholarship_article_clusters ─────────────────────────────────────────
-- Top-level cluster entity. One cluster per scholarship_record — the parent
-- that groups all locale/domain variants together for atomic publishing.

CREATE TABLE scholarship_article_clusters (
  id                    UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  scholarship_record_id TEXT  NOT NULL REFERENCES scholarship_records(id) ON DELETE CASCADE,
  cluster_status        TEXT  NOT NULL DEFAULT 'assembling'
    CHECK (cluster_status IN ('assembling', 'assembled', 'publishing', 'published', 'failed')),
  intake_key            TEXT  NOT NULL,  -- the intake_key this cluster was built for
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (scholarship_record_id, intake_key)  -- one cluster per scholarship × cycle
);

CREATE INDEX idx_scholarship_clusters_record_id
  ON scholarship_article_clusters(scholarship_record_id);

COMMENT ON TABLE scholarship_article_clusters IS
  'Top-level cluster entity grouping all locale variants of a scholarship article. '
  'UNIQUE(scholarship_record_id, intake_key) ensures one cluster per cycle.';


-- ─── 4. scholarship_article_variants ─────────────────────────────────────────
-- One row per published locale/domain variant. Fully relational — per-domain
-- ISR retry queries are trivial: SELECT * WHERE cluster_id = $1 AND site_id = $2.
-- canonicalUrl stored as an absolute HTTPS URL (enforced by CHECK constraint).

CREATE TABLE scholarship_article_variants (
  id                    UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id            UUID  NOT NULL REFERENCES scholarship_article_clusters(id) ON DELETE CASCADE,
  site_id               UUID  NOT NULL REFERENCES site_configs(id) ON DELETE CASCADE,

  locale                TEXT  NOT NULL,   -- BCP 47 (e.g. 'de-DE', 'ur-PK', 'en-US')

  -- Absolute canonical URL — required for correct hreflang tags.
  -- Relative URLs cause Google Search Console "Alternate URL not available" errors.
  canonical_url         TEXT  NOT NULL
    CHECK (canonical_url LIKE 'https://%'),

  -- Per-site ISR webhook endpoint (each Next.js site has its own revalidation endpoint)
  revalidation_endpoint TEXT  NOT NULL
    CHECK (revalidation_endpoint LIKE 'https://%'),

  -- ISR tracking per domain (v5 fan-out fix)
  isr_status            TEXT  NOT NULL DEFAULT 'pending'
    CHECK (isr_status IN ('pending', 'success', 'failed', 'retrying')),
  isr_retry_count       INTEGER NOT NULL DEFAULT 0,
  last_revalidated_at   TIMESTAMPTZ,

  -- Assembled HTML + SEO for this locale (stored after cluster assembly, before ISR)
  assembled_html        TEXT,
  seo_title             TEXT,
  seo_description       TEXT,

  published_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (cluster_id, locale)  -- one variant per locale per cluster
);

CREATE INDEX idx_scholarship_variants_cluster_id
  ON scholarship_article_variants(cluster_id);

CREATE INDEX idx_scholarship_variants_site_id
  ON scholarship_article_variants(site_id);

CREATE INDEX idx_scholarship_variants_isr_status
  ON scholarship_article_variants(isr_status)
  WHERE isr_status IN ('failed', 'retrying');  -- partial index — only rows needing attention

COMMENT ON TABLE scholarship_article_variants IS
  'One row per published locale/domain variant in a scholarship article cluster. '
  'canonical_url and revalidation_endpoint are enforced as absolute HTTPS URLs. '
  'isr_status tracks per-domain ISR fan-out state (v5 fix).';

COMMENT ON COLUMN scholarship_article_variants.canonical_url IS
  'REQUIRED: fully-qualified absolute URL. '
  'e.g. https://studygermany.de/scholarships/germany/daad-epos — never a relative path. '
  'Relative URLs in hreflang tags cause Google Search Console errors.';

COMMENT ON COLUMN scholarship_article_variants.revalidation_endpoint IS
  'Each deployed Next.js site exposes its own POST /api/revalidate endpoint. '
  'Fan-out via Promise.allSettled() — one HTTP POST per variant (v5 fix).';


-- ─── 5. scholarship_cluster_jobs ─────────────────────────────────────────────
-- Tracks the state of Atomic Cluster Jobs (Phase 8.4).
-- revalidation_results JSONB stores the per-domain ISR outcomes for monitoring.

CREATE TABLE scholarship_cluster_jobs (
  id                    UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id            UUID    NOT NULL REFERENCES scholarship_article_clusters(id) ON DELETE CASCADE,
  scholarship_record_id TEXT    NOT NULL REFERENCES scholarship_records(id) ON DELETE CASCADE,
  intake_key            TEXT    NOT NULL,
  target_locales        TEXT[]  NOT NULL DEFAULT '{}',
  build_path            TEXT    NOT NULL
    CHECK (build_path IN ('new_cycle', 'amendment')),
  job_status            TEXT    NOT NULL DEFAULT 'translating'
    CHECK (job_status IN ('translating', 'assembled', 'publishing', 'published', 'failed')),

  -- Per-domain ISR revalidation results (v5 tracking)
  -- Shape: [{ siteId, locale, status: 'success'|'failed', retryCount, lastAttemptAt }]
  revalidation_results  JSONB   NOT NULL DEFAULT '[]',

  published_at          TIMESTAMPTZ,
  failed_reason         TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cluster_jobs_cluster_id
  ON scholarship_cluster_jobs(cluster_id);

CREATE INDEX idx_cluster_jobs_status
  ON scholarship_cluster_jobs(job_status)
  WHERE job_status NOT IN ('published');  -- partial index — only active jobs

COMMENT ON TABLE scholarship_cluster_jobs IS
  'Tracks state of Atomic Cluster Publish jobs. '
  'revalidation_results stores per-domain ISR fan-out outcomes for Phase 9 monitoring.';

COMMENT ON COLUMN scholarship_cluster_jobs.revalidation_results IS
  'JSONB array: [{ siteId, locale, status, retryCount, lastAttemptAt }]. '
  'Populated by dispatchIsrFanOut() after each domain POST. '
  'Phase 9 alerts on any entry with status=failed and retryCount > 3.';


-- ─── 6. scholarship_fetch_log ─────────────────────────────────────────────────
-- Append-only audit log. Every fetch attempt recorded, including hash comparison
-- outcomes and build path determination. Never updated — only inserted.

CREATE TABLE scholarship_fetch_log (
  id                        UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  scholarship_record_id     TEXT    REFERENCES scholarship_records(id) ON DELETE SET NULL,
  source_url                TEXT    NOT NULL,
  source_tier               INTEGER,

  -- Fetch outcome
  http_status               INTEGER,
  engine_used               TEXT
    CHECK (engine_used IN ('cheerio', 'playwright', 'api', 'pdf')),
  fetch_error               TEXT,

  -- Stage 1: cleanContentHash comparison
  clean_content_hash_before TEXT,
  clean_content_hash_after  TEXT,
  stage1_changed            BOOLEAN,  -- NULL = first fetch (no prior hash)

  -- Stage 2: semanticRecordHash comparison (only set if stage1_changed = true)
  semantic_hash_before      TEXT,
  semantic_hash_after       TEXT,
  stage2_changed            BOOLEAN,  -- NULL = extraction not triggered

  -- Downstream action
  extraction_triggered      BOOLEAN  NOT NULL DEFAULT false,
  article_rebuild_triggered BOOLEAN  NOT NULL DEFAULT false,
  build_path                TEXT
    CHECK (build_path IN ('new_cycle', 'amendment')),

  fetched_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fetch_log_record_id
  ON scholarship_fetch_log(scholarship_record_id);

CREATE INDEX idx_fetch_log_fetched_at
  ON scholarship_fetch_log(fetched_at DESC);

COMMENT ON TABLE scholarship_fetch_log IS
  'Append-only audit log for every fetch attempt. '
  'Records both hash stages and downstream action for pipeline observability (Phase 9).';


-- ─── 7. scholarship_quarantine ───────────────────────────────────────────────
-- Persisted quarantine table. Every QA-failed record lands here.
-- Reviewer actions are stored in the same row (approve/reject audit trail).

CREATE TABLE scholarship_quarantine (
  id                    UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  scholarship_record_id TEXT  REFERENCES scholarship_records(id) ON DELETE CASCADE,
  source_url            TEXT  NOT NULL,
  source_tier           INTEGER,

  -- Failure details
  failure_reason        TEXT  NOT NULL,
  failure_details       JSONB NOT NULL DEFAULT '{}',  -- structured reason payload
  -- rawEvidence map: verbatim source sentences for each flagged field (Phase 3.2)
  raw_evidence          JSONB NOT NULL DEFAULT '{}',

  -- Partial extraction output (for reviewer display)
  extracted_record      JSONB,  -- ScholarshipRecord partial — as far as extraction got

  -- Review state
  review_status         TEXT  NOT NULL DEFAULT 'pending'
    CHECK (review_status IN ('pending', 'approved', 'rejected')),
  reviewed_by           TEXT,
  reviewer_notes        TEXT,
  reviewed_at           TIMESTAMPTZ,

  -- If approved: re-queued job ID
  requeued_job_id       TEXT,

  quarantined_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quarantine_record_id
  ON scholarship_quarantine(scholarship_record_id);

CREATE INDEX idx_quarantine_review_status
  ON scholarship_quarantine(review_status)
  WHERE review_status = 'pending';

COMMENT ON TABLE scholarship_quarantine IS
  'Quarantined records awaiting human review. '
  'failure_reason codes: broken_official_link, slot_injection_error, '
  'extraction_api_failure, translation_slot_corruption, tier3_only, llm_plausibility_error.';


-- ─── RLS ─────────────────────────────────────────────────────────────────────
-- All scholarship tables: service role access only.
-- No public read policies — this is a backend-only pipeline.

ALTER TABLE scholarship_records           ENABLE ROW LEVEL SECURITY;
ALTER TABLE scholarship_intakes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE scholarship_article_clusters  ENABLE ROW LEVEL SECURITY;
ALTER TABLE scholarship_article_variants  ENABLE ROW LEVEL SECURITY;
ALTER TABLE scholarship_cluster_jobs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE scholarship_fetch_log         ENABLE ROW LEVEL SECURITY;
ALTER TABLE scholarship_quarantine        ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS by default in Supabase — no explicit GRANT needed.
-- Explicit grants mirror the pattern from 20260731202700_grant_service_role.sql:
GRANT ALL ON public.scholarship_records           TO service_role;
GRANT ALL ON public.scholarship_intakes           TO service_role;
GRANT ALL ON public.scholarship_article_clusters  TO service_role;
GRANT ALL ON public.scholarship_article_variants  TO service_role;
GRANT ALL ON public.scholarship_cluster_jobs      TO service_role;
GRANT ALL ON public.scholarship_fetch_log         TO service_role;
GRANT ALL ON public.scholarship_quarantine        TO service_role;

-- PostgREST cache reload (mirrors pattern from 20260804140100_reload_postgrest_schema.sql)
NOTIFY pgrst, 'reload schema';
