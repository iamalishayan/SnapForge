-- Run in Supabase Dashboard → SQL Editor (production project)
-- Ensures columns/statuses required by current SnapForge code exist.

ALTER TABLE articles ADD COLUMN IF NOT EXISTS article_css TEXT;

COMMENT ON COLUMN articles.article_css IS
  'Full CSS extracted from ingested HTML pages for pixel-perfect rendering';

-- Translation processing / failed statuses (if not already applied)
ALTER TABLE translations DROP CONSTRAINT IF EXISTS translations_status_check;
ALTER TABLE translations
  ADD CONSTRAINT translations_status_check
  CHECK (
    status IN (
      'staging',
      'qa_queue',
      'qa_approved',
      'published',
      'flagged',
      'processing',
      'failed'
    )
  );

ALTER TABLE translations ADD COLUMN IF NOT EXISTS last_error text;
