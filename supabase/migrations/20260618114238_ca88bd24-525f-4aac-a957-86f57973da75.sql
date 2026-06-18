SELECT cron.unschedule('generate-weekly-blog-post');
SELECT cron.schedule(
  'generate-weekly-blog-post',
  '0 12 * * 1',
  $$
  SELECT net.http_post(
    url:='https://atmsbgapyenaikbpjtuz.supabase.co/functions/v1/generate-weekly-post',
    headers:=jsonb_build_object(
      'Content-Type','application/json',
      'apikey', current_setting('app.settings.service_role_key', true),
      'Authorization','Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body:='{}'::jsonb
  ) AS request_id;
  $$
);