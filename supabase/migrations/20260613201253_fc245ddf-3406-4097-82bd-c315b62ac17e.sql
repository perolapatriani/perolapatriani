
CREATE TABLE public.seller_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  property_type text,
  address text,
  neighborhood text,
  desired_price numeric,
  bedrooms int,
  notes text,
  source text DEFAULT 'sell_form',
  status text NOT NULL DEFAULT 'novo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seller_leads TO authenticated;
GRANT INSERT ON public.seller_leads TO anon;
GRANT ALL ON public.seller_leads TO service_role;
ALTER TABLE public.seller_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can create seller lead" ON public.seller_leads FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins read seller leads" ON public.seller_leads FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update seller leads" ON public.seller_leads FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete seller leads" ON public.seller_leads FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER seller_leads_updated_at BEFORE UPDATE ON public.seller_leads FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.match_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  recommended_property_ids uuid[] DEFAULT '{}',
  ai_reasoning text,
  status text NOT NULL DEFAULT 'novo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_leads TO authenticated;
GRANT INSERT ON public.match_leads TO anon;
GRANT ALL ON public.match_leads TO service_role;
ALTER TABLE public.match_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can create match lead" ON public.match_leads FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins read match leads" ON public.match_leads FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update match leads" ON public.match_leads FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete match leads" ON public.match_leads FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER match_leads_updated_at BEFORE UPDATE ON public.match_leads FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
