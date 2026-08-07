-- Image translation Phase 0: store detected image text + QA flag on translations
ALTER TABLE translations
  ADD COLUMN IF NOT EXISTS image_texts JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS image_translation_needed BOOLEAN DEFAULT false;

COMMENT ON COLUMN translations.image_texts IS 'Per-image OCR/vision results: src, original/translated text segments, status';
COMMENT ON COLUMN translations.image_translation_needed IS 'True when images contain translatable text or detection failed';
