-- Migration: Add article_css column to articles table
-- Stores per-article CSS extracted from the <style> tag at ingestion time.
-- This column is intentionally excluded from the translation payload so the
-- AI never sees it. It is language-agnostic and injected at render time.

ALTER TABLE articles ADD COLUMN IF NOT EXISTS article_css TEXT;

COMMENT ON COLUMN articles.article_css IS
  'Custom CSS extracted from the <style> tag of the source HTML. '
  'Never translated. Injected as a <style> block at render time on the sites app.';
