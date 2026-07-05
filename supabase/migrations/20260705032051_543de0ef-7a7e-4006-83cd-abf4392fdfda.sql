
-- 1. Blog: campo de agendamento
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS scheduled_for timestamptz;
CREATE INDEX IF NOT EXISTS idx_posts_scheduled_for ON public.posts(scheduled_for) WHERE is_published = false AND scheduled_for IS NOT NULL;

-- 2. site_events
CREATE TABLE IF NOT EXISTS public.site_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  path text,
  session_id text,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.site_events TO anon, authenticated;
GRANT SELECT, DELETE ON public.site_events TO authenticated;
GRANT ALL ON public.site_events TO service_role;

ALTER TABLE public.site_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert site events"
  ON public.site_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read site events"
  ON public.site_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete site events"
  ON public.site_events FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_site_events_type_created ON public.site_events(type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_events_created ON public.site_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_events_property ON public.site_events(property_id) WHERE property_id IS NOT NULL;

-- 3. Publicador de rascunhos agendados
CREATE OR REPLACE FUNCTION public.publish_scheduled_posts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_count integer;
BEGIN
  WITH upd AS (
    UPDATE public.posts
       SET is_published = true,
           published_at = COALESCE(published_at, scheduled_for, now()),
           updated_at = now()
     WHERE is_published = false
       AND scheduled_for IS NOT NULL
       AND scheduled_for <= now()
    RETURNING 1
  )
  SELECT count(*) INTO v_count FROM upd;
  RETURN v_count;
END $$;

REVOKE ALL ON FUNCTION public.publish_scheduled_posts() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.publish_scheduled_posts() TO service_role;

-- 4. Remove crons antigos de IA e cria o novo
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT jobid, jobname FROM cron.job
           WHERE jobname IN ('generate-weekly-blog-post','generate-weekly-post','publish-scheduled-posts')
  LOOP
    PERFORM cron.unschedule(r.jobid);
  END LOOP;
END $$;

SELECT cron.schedule(
  'publish-scheduled-posts',
  '*/15 * * * *',
  $$ SELECT public.publish_scheduled_posts(); $$
);
