CREATE OR REPLACE FUNCTION public.is_profile_published(p_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = p_id AND is_published = true);
$$;

GRANT EXECUTE ON FUNCTION public.is_profile_published(uuid) TO anon, authenticated, service_role;