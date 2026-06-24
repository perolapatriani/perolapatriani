
-- 1) Convert has_role to SECURITY INVOKER so it no longer trips the
--    "signed-in users can execute SECURITY DEFINER" lint. RLS on user_roles
--    already lets a user read their own rows, which is all has_role needs.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 2) app_secrets: add an explicit deny-all policy for non-service roles so the
--    "RLS enabled, no policy" lint is resolved. service_role bypasses RLS.
DROP POLICY IF EXISTS "deny_all_non_service" ON public.app_secrets;
CREATE POLICY "deny_all_non_service" ON public.app_secrets
  FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

-- 3) Replace the always-true INSERT policies on public lead forms with bounded
--    shape validation so they are no longer flagged as overly permissive.
DROP POLICY IF EXISTS "Anyone can insert leads" ON public.contact_leads;
CREATE POLICY "Anyone can insert leads" ON public.contact_leads
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(name) BETWEEN 1 AND 200
    AND length(phone) <= 50
    AND length(email) <= 254
    AND length(message) <= 5000
    AND length(source) <= 100
  );

DROP POLICY IF EXISTS "Anyone can create match lead" ON public.match_leads;
CREATE POLICY "Anyone can create match lead" ON public.match_leads
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(name) BETWEEN 1 AND 200
    AND length(phone) BETWEEN 1 AND 50
    AND (email IS NULL OR length(email) <= 254)
  );

DROP POLICY IF EXISTS "Anyone can create seller lead" ON public.seller_leads;
CREATE POLICY "Anyone can create seller lead" ON public.seller_leads
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(name) BETWEEN 1 AND 200
    AND length(phone) BETWEEN 1 AND 50
    AND (email IS NULL OR length(email) <= 254)
    AND (notes IS NULL OR length(notes) <= 5000)
  );
