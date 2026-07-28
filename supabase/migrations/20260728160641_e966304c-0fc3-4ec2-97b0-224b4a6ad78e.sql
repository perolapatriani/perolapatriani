-- posts: SEO extras
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS meta_description text,
  ADD COLUMN IF NOT EXISTS keywords text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS faq jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS property_id uuid,
  ADD COLUMN IF NOT EXISTS auto_generated boolean NOT NULL DEFAULT false;

-- social_posts
CREATE TABLE IF NOT EXISTS public.social_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel text NOT NULL,
  kind text NOT NULL DEFAULT 'feed',
  status text NOT NULL DEFAULT 'rascunho',
  caption text,
  hashtags text[] NOT NULL DEFAULT '{}',
  alt_text text,
  location_name text,
  link_url text,
  image_url text,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  launch_id uuid REFERENCES public.launches(id) ON DELETE SET NULL,
  post_id uuid REFERENCES public.posts(id) ON DELETE SET NULL,
  scheduled_for timestamptz,
  published_at timestamptz,
  external_id text,
  error_message text,
  reach integer NOT NULL DEFAULT 0,
  likes integer NOT NULL DEFAULT 0,
  comments integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  metrics_updated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_posts TO authenticated;
GRANT ALL ON public.social_posts TO service_role;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_social_posts" ON public.social_posts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE INDEX IF NOT EXISTS social_posts_sched_idx ON public.social_posts (status, scheduled_for);

-- automation_jobs
CREATE TABLE IF NOT EXISTS public.automation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  status text NOT NULL DEFAULT 'pendente',
  attempts integer NOT NULL DEFAULT 0,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_message text,
  run_after timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.automation_jobs TO authenticated;
GRANT ALL ON public.automation_jobs TO service_role;
ALTER TABLE public.automation_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_automation_jobs" ON public.automation_jobs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE INDEX IF NOT EXISTS automation_jobs_queue_idx ON public.automation_jobs (status, run_after);

-- integration_settings
CREATE TABLE IF NOT EXISTS public.integration_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL UNIQUE,
  is_enabled boolean NOT NULL DEFAULT false,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'nao_conectado',
  last_checked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.integration_settings TO authenticated;
GRANT ALL ON public.integration_settings TO service_role;
ALTER TABLE public.integration_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_integration_settings" ON public.integration_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- updated_at triggers
DROP TRIGGER IF EXISTS set_social_posts_updated_at ON public.social_posts;
CREATE TRIGGER set_social_posts_updated_at BEFORE UPDATE ON public.social_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_automation_jobs_updated_at ON public.automation_jobs;
CREATE TRIGGER set_automation_jobs_updated_at BEFORE UPDATE ON public.automation_jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_integration_settings_updated_at ON public.integration_settings;
CREATE TRIGGER set_integration_settings_updated_at BEFORE UPDATE ON public.integration_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();