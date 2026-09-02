-- Persist which job visual theme compiled into content + article_css.
-- job_slots stores structured fields so edits can re-compile without guessing.

ALTER TABLE articles ADD COLUMN IF NOT EXISTS visual_theme TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS job_slots JSONB;

COMMENT ON COLUMN articles.visual_theme IS
  'Optional visual theme slug (e.g. job-corporate, job-startup). '
  'Themes compile into content + article_css at save time; not a pipeline template.';

COMMENT ON COLUMN articles.job_slots IS
  'Structured job-post field values used to recompile visual themes on edit.';
