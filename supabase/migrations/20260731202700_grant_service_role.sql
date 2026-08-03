-- Grant full access to service_role on all admin tables
-- This is required because RLS is enabled but the service_role needs to bypass it
-- without this, even the service_role JWT gets "permission denied" from PostgreSQL grants

grant all on public.templates to service_role;
grant all on public.articles to service_role;
grant all on public.translations to service_role;
grant all on public.site_configs to service_role;
grant all on public.qa_queue to service_role;
grant all on public.publish_log to service_role;
grant all on public.keywords to service_role;
grant all on public.cost_log to service_role;
grant all on public.indexing_stats to service_role;
grant all on public.api_keys to service_role;

-- Grant on sequences so inserts work
grant usage, select on all sequences in schema public to service_role;
