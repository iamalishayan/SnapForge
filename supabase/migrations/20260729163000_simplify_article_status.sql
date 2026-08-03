-- Article status describes English source content readiness, NOT translation publish state.
-- Translation pipeline statuses live on translations.status (staging → qa_queue → qa_approved → published).

UPDATE articles
SET status = 'draft'
WHERE status IS NULL OR status NOT IN ('draft', 'ready');

ALTER TABLE articles DROP CONSTRAINT IF EXISTS articles_status_check;

ALTER TABLE articles
  ADD CONSTRAINT articles_status_check CHECK (status IN ('draft', 'ready'));

ALTER TABLE articles ALTER COLUMN status SET DEFAULT 'draft';
