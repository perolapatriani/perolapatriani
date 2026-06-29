
-- Lock down direct execution; triggers run with definer privileges regardless.
REVOKE EXECUTE ON FUNCTION public.merge_lead(text,text,text,text,text,text,jsonb,timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.merge_lead(text,text,text,text,text,text,jsonb,timestamptz) TO service_role;

REVOKE EXECUTE ON FUNCTION public.trg_contact_lead_to_crm() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_seller_lead_to_crm() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_match_lead_to_crm() FROM PUBLIC, anon, authenticated;

-- Set search_path on helpers
ALTER FUNCTION public.normalize_phone(text) SET search_path = public;
ALTER FUNCTION public.normalize_email(text) SET search_path = public;
