-- Run in Supabase Dashboard → SQL Editor (production project)
-- Ensures columns/statuses required by current SnapForge code exist.

ALTER TABLE articles ADD COLUMN IF NOT EXISTS article_css TEXT;

COMMENT ON COLUMN articles.article_css IS
  'Full CSS extracted from ingested HTML pages for pixel-perfect rendering';

ALTER TABLE articles ADD COLUMN IF NOT EXISTS visual_theme TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS job_slots JSONB;

COMMENT ON COLUMN articles.visual_theme IS
  'Optional visual theme slug (e.g. job-corporate, job-startup)';

COMMENT ON COLUMN articles.job_slots IS
  'Structured job-post fields for visual theme recompilation';

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

-- Keywords permissions
GRANT ALL ON public.keywords TO service_role;
GRANT ALL ON public.keywords TO postgres;
GRANT ALL ON public.keywords TO authenticated;
GRANT ALL ON public.keywords TO anon;
ALTER TABLE public.keywords ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on keywords" ON public.keywords;
CREATE POLICY "Service role full access on keywords" ON public.keywords
  FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Public read keywords" ON public.keywords;
CREATE POLICY "Public read keywords" ON public.keywords
  FOR SELECT TO anon, authenticated USING (true);

NOTIFY pgrst, 'reload schema';
