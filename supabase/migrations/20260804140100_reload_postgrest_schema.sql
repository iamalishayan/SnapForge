-- Force PostgREST to reload its schema cache so new tables are visible via REST
NOTIFY pgrst, 'reload schema';
