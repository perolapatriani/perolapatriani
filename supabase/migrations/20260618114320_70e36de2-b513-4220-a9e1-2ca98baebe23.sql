CREATE TABLE IF NOT EXISTS public.app_secrets (
  key text PRIMARY KEY,
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

REVOKE ALL ON public.app_secrets FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.app_secrets TO service_role;
ALTER TABLE public.app_secrets ENABLE ROW LEVEL SECURITY;
-- No policies: only service_role (which bypasses RLS) can read/write.

INSERT INTO public.app_secrets (key, value)
VALUES ('weekly_post_cron', encode(gen_random_bytes(32), 'hex'))
ON CONFLICT (key) DO NOTHING;

SELECT cron.unschedule('generate-weekly-blog-post');
SELECT cron.schedule(
  'generate-weekly-blog-post',
  '0 12 * * 1',
  $cron$
  SELECT net.http_post(
    url:='https://atmsbgapyenaikbpjtuz.supabase.co/functions/v1/generate-weekly-post',
    headers:=jsonb_build_object(
      'Content-Type','application/json',
      'apikey','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0bXNiZ2FweWVuYWlrYnBqdHV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczODk1NzIsImV4cCI6MjA5Mjk2NTU3Mn0.x5ub_oo8a8eNZwyFLGMVMZWNrpmoKMVLgUPoQfv0YFY',
      'X-Cron-Secret',(SELECT value FROM public.app_secrets WHERE key='weekly_post_cron')
    ),
    body:='{}'::jsonb
  ) AS request_id;
  $cron$
);