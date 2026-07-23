REVOKE EXECUTE ON FUNCTION public.auto_join_college_by_email() FROM public;
REVOKE EXECUTE ON FUNCTION public.auto_join_college_by_email() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated;