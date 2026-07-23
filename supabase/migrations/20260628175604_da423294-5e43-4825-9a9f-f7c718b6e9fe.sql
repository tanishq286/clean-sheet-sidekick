GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_profile_published(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_verified_student(uuid) TO authenticated;