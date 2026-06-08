
DROP TRIGGER IF EXISTS on_auth_user_created_promote_admin ON auth.users;
DROP FUNCTION IF EXISTS public.promote_first_user_to_admin();

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
