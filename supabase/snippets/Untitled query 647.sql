-- Per-article URL slug (unique within template) for multi-article sites rendering
ALTER TABLE articles ADD COLUMN IF NOT EXISTS slug text;

UPDATE articles
SET slug = lower(
  regexp_replace(
    regexp_replace(trim(title), '[^a-zA-Z0-9]+', '-', 'g'),
    '(^-|-$)',
    '',
    'g'
  )
)
WHERE slug IS NULL OR slug = '';

-- Resolve duplicate slugs within the same template
UPDATE articles a
SET slug = a.slug || '-' || substr(a.id::text, 1, 8)
FROM (
  SELECT template_id, slug
  FROM articles
  WHERE deleted_at IS NULL
  GROUP BY template_id, slug
  HAVING count(*) > 1
) dup
WHERE a.template_id = dup.template_id
  AND a.slug = dup.slug;

ALTER TABLE articles ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_template_slug
  ON articles (template_id, slug)
  WHERE deleted_at IS NULL;
