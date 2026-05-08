-- Lock down short_urls table: service role bypasses RLS automatically,
-- so public SELECT and ALL policies are unnecessary and overly permissive.
DROP POLICY IF EXISTS "Anyone can read short_urls for redirect" ON public.short_urls;
DROP POLICY IF EXISTS "Service role can manage short_urls" ON public.short_urls;

-- RLS remains enabled; with no policies, anon/authenticated clients have no access.
-- The redirect and shorten-url edge functions use the service role key, which bypasses RLS.