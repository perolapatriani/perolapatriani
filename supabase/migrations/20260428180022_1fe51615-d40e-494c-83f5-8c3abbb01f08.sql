-- Fix search_path das funções restantes
ALTER FUNCTION public.set_updated_at() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- Revogar EXECUTE público das SECURITY DEFINER (mantém uso interno por triggers/policies)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, authenticated, public;
-- has_role precisa ser chamável por authenticated (usada em policies como expressão SQL — isso já roda como definer; mas para segurança removemos do anon)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- Restringir listagem do bucket: substituir SELECT amplo
DROP POLICY IF EXISTS "public_read_media" ON storage.objects;

-- Público só pode acessar objetos individuais por URL pública (CDN), mas não LISTAR.
-- Para o RLS do storage.objects, criamos um SELECT que só admins podem usar para listagem via API.
CREATE POLICY "admins_list_media" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));