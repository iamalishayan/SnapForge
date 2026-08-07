-- Allow processing/failed lifecycle statuses and store last job error for admin UI

ALTER TABLE translations DROP CONSTRAINT IF EXISTS translations_status_check;

ALTER TABLE translations ADD CONSTRAINT translations_status_check
  CHECK (status IN (
    'processing',
    'failed',
    'staging',
    'qa_queue',
    'qa_approved',
    'published',
    'flagged'
  ));

ALTER TABLE translations ADD COLUMN IF NOT EXISTS last_error text;

COMMENT ON COLUMN translations.last_error IS 'Last permanent job failure message (cleared on success)';
