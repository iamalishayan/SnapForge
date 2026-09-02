-- Grant permissions on keywords table
-- Required because 20260811210000_force_modify_keywords.sql dropped and recreated the table,
-- which wiped previous grants from 20260731202700_grant_service_role.sql.

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
