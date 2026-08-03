-- Articles must belong to a template (translation pipeline reads template keywords + gemini_prompt)
ALTER TABLE articles
  ALTER COLUMN template_id SET NOT NULL;
